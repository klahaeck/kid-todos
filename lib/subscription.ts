import type { BillingSubscription } from "@clerk/backend";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { householdContextForUserId, roleGrantsAllFeatures } from "@/lib/authz";
import {
  entitlementsDocToSnapshot,
  getHouseholdEntitlementsForOwner,
  upsertHouseholdEntitlementsFromPrimary,
} from "@/lib/data/household-entitlements";

export const BILLING_PLANS = {
  monthly: process.env.CLERK_MONTHLY_PLAN_SLUG ?? "monthly",
} as const;

export const BILLING_FEATURES = {
  multipleChildren:
    process.env.CLERK_FEATURE_MULTIPLE_CHILDREN ?? "multiple_children",
  /** Morning + evening; free tier is evening-only in the app UI. */
  allRoutines: process.env.CLERK_FEATURE_ALL_ROUTINES ?? "all_routines",
  /** Custom dashboard color theme + font (free tier uses Classic + Geist). */
  allThemes: process.env.CLERK_FEATURE_ALL_THEMES ?? "all_themes",
  /** Invite other parents to the same household (Clerk Billing feature slug). */
  multipleUsers:
    process.env.CLERK_FEATURE_MULTIPLE_USERS ?? "multiple_users",
} as const;

type PlanAccess = { plan: string } | { feature: string };

type AuthHas = Awaited<ReturnType<typeof auth>>["has"];

function canAccess(has: AuthHas | undefined, access: PlanAccess): boolean {
  if (!has) return false;
  return has(access);
}

async function subscriptionBypassFromRole(): Promise<boolean> {
  const user = await currentUser();
  return roleGrantsAllFeatures(user);
}

export type ResolvedEntitlements = {
  isMonthlySubscriber: boolean;
  hasMultipleChildrenFeature: boolean;
  hasAllRoutinesFeature: boolean;
  hasAllThemesFeature: boolean;
  hasMultipleUsersFeature: boolean;
};

const NO_ENTITLEMENTS: ResolvedEntitlements = {
  isMonthlySubscriber: false,
  hasMultipleChildrenFeature: false,
  hasAllRoutinesFeature: false,
  hasAllThemesFeature: false,
  hasMultipleUsersFeature: false,
};

const ALL_ENTITLEMENTS: ResolvedEntitlements = {
  isMonthlySubscriber: true,
  hasMultipleChildrenFeature: true,
  hasAllRoutinesFeature: true,
  hasAllThemesFeature: true,
  hasMultipleUsersFeature: true,
};

function entitlementsFromSessionHas(has: AuthHas | undefined): ResolvedEntitlements {
  return {
    isMonthlySubscriber: canAccess(has, { plan: BILLING_PLANS.monthly }),
    hasMultipleChildrenFeature: canAccess(has, {
      feature: BILLING_FEATURES.multipleChildren,
    }),
    hasAllRoutinesFeature: canAccess(has, {
      feature: BILLING_FEATURES.allRoutines,
    }),
    hasAllThemesFeature: canAccess(has, {
      feature: BILLING_FEATURES.allThemes,
    }),
    hasMultipleUsersFeature: canAccess(has, {
      feature: BILLING_FEATURES.multipleUsers,
    }),
  };
}

function entitlementsFromBillingSubscription(
  sub: BillingSubscription,
): ResolvedEntitlements {
  const subLive = sub.status === "active" || sub.status === "past_due";
  if (!subLive) {
    return { ...NO_ENTITLEMENTS };
  }

  const featureSlugs = new Set<string>();
  let hasMonthlyPlan = false;
  const monthlySlug = BILLING_PLANS.monthly;

  for (const item of sub.subscriptionItems) {
    if (item.endedAt != null) continue;
    if (item.status !== "active" && item.status !== "past_due") continue;
    const plan = item.plan;
    if (!plan) continue;
    if (plan.slug === monthlySlug) {
      hasMonthlyPlan = true;
    }
    for (const f of plan.features ?? []) {
      featureSlugs.add(f.slug);
    }
  }

  return {
    isMonthlySubscriber: hasMonthlyPlan,
    hasMultipleChildrenFeature: featureSlugs.has(
      BILLING_FEATURES.multipleChildren,
    ),
    hasAllRoutinesFeature: featureSlugs.has(BILLING_FEATURES.allRoutines),
    hasAllThemesFeature: featureSlugs.has(BILLING_FEATURES.allThemes),
    hasMultipleUsersFeature: featureSlugs.has(BILLING_FEATURES.multipleUsers),
  };
}

/** Persist primary’s Clerk session entitlements so household members stay in sync. */
async function syncPrimaryEntitlementSnapshotIfOwner(
  viewerId: string,
  dataOwnerId: string,
  ent: ResolvedEntitlements,
): Promise<void> {
  if (viewerId !== dataOwnerId) return;
  await upsertHouseholdEntitlementsFromPrimary(dataOwnerId, ent);
}

async function entitlementsForBillingUser(ownerClerkId: string): Promise<ResolvedEntitlements> {
  const cached = await getHouseholdEntitlementsForOwner(ownerClerkId);
  if (cached) {
    return entitlementsDocToSnapshot(cached);
  }
  try {
    const client = await clerkClient();
    const sub = await client.billing.getUserBillingSubscription(ownerClerkId);
    return entitlementsFromBillingSubscription(sub);
  } catch {
    return { ...NO_ENTITLEMENTS };
  }
}

async function effectiveEntitlements(): Promise<ResolvedEntitlements | null> {
  const { userId, has, isAuthenticated } = await auth();
  if (!userId || !isAuthenticated) return null;
  if (await subscriptionBypassFromRole()) {
    const ctx = await householdContextForUserId(userId);
    const ent = { ...ALL_ENTITLEMENTS };
    await syncPrimaryEntitlementSnapshotIfOwner(userId, ctx.dataOwnerId, ent);
    return ent;
  }
  const ctx = await householdContextForUserId(userId);
  if (ctx.dataOwnerId === userId) {
    const ent = entitlementsFromSessionHas(has);
    await syncPrimaryEntitlementSnapshotIfOwner(userId, ctx.dataOwnerId, ent);
    return ent;
  }
  return entitlementsForBillingUser(ctx.dataOwnerId);
}

export type SubscriptionAccess = ResolvedEntitlements & {
  isAuthenticated: boolean;
  /** False when the user is a household member (billing is on the primary). */
  isPrimary: boolean;
};

export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  const { userId, has, isAuthenticated } = await auth();
  if (!userId || !isAuthenticated) {
    return {
      isAuthenticated: false,
      isPrimary: true,
      ...NO_ENTITLEMENTS,
    };
  }

  const ctx = await householdContextForUserId(userId);

  if (await subscriptionBypassFromRole()) {
    const ent = { ...ALL_ENTITLEMENTS };
    await syncPrimaryEntitlementSnapshotIfOwner(userId, ctx.dataOwnerId, ent);
    return {
      isAuthenticated: true,
      isPrimary: ctx.isPrimary,
      ...ent,
    };
  }

  const ent =
    ctx.dataOwnerId === userId
      ? entitlementsFromSessionHas(has)
      : await entitlementsForBillingUser(ctx.dataOwnerId);

  await syncPrimaryEntitlementSnapshotIfOwner(userId, ctx.dataOwnerId, ent);

  return {
    isAuthenticated: true,
    isPrimary: ctx.isPrimary,
    ...ent,
  };
}

export async function hasMultipleChildrenFeature() {
  const e = await effectiveEntitlements();
  if (!e) return false;
  return e.hasMultipleChildrenFeature;
}

export async function hasAllRoutinesFeature() {
  const e = await effectiveEntitlements();
  if (!e) return false;
  return e.hasAllRoutinesFeature;
}

export async function hasAllThemesFeature() {
  const e = await effectiveEntitlements();
  if (!e) return false;
  return e.hasAllThemesFeature;
}

export async function hasMultipleUsersFeature() {
  const e = await effectiveEntitlements();
  if (!e) return false;
  return e.hasMultipleUsersFeature;
}
