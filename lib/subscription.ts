import { auth, currentUser } from "@clerk/nextjs/server";
import { roleGrantsAllFeatures } from "@/lib/authz";

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

export async function getSubscriptionAccess() {
  const { isAuthenticated, has } = await auth();
  if (!isAuthenticated) {
    return {
      isAuthenticated: false,
      isMonthlySubscriber: false,
      hasMultipleChildrenFeature: false,
      hasAllRoutinesFeature: false,
      hasAllThemesFeature: false,
    };
  }

  if (await subscriptionBypassFromRole()) {
    return {
      isAuthenticated: true,
      isMonthlySubscriber: true,
      hasMultipleChildrenFeature: true,
      hasAllRoutinesFeature: true,
      hasAllThemesFeature: true,
    };
  }

  return {
    isAuthenticated: true,
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
  };
}

export async function hasMultipleChildrenFeature() {
  const { userId, has } = await auth();
  if (!userId) return false;
  if (await subscriptionBypassFromRole()) return true;
  return canAccess(has, { feature: BILLING_FEATURES.multipleChildren });
}

export async function hasAllRoutinesFeature() {
  const { userId, has } = await auth();
  if (!userId) return false;
  if (await subscriptionBypassFromRole()) return true;
  return canAccess(has, { feature: BILLING_FEATURES.allRoutines });
}

export async function hasAllThemesFeature() {
  const { userId, has } = await auth();
  if (!userId) return false;
  if (await subscriptionBypassFromRole()) return true;
  return canAccess(has, { feature: BILLING_FEATURES.allThemes });
}
