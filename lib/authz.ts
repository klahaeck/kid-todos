import { auth, currentUser } from "@clerk/nextjs/server";
import { getHouseholdOwnerForMember } from "@/lib/data/household";

export type AppRole = "user" | "admin";

/** Signed-in user vs Mongo data scope for shared household routines. */
export type HouseholdContext = {
  viewerId: string;
  /** Clerk user id that owns children/tasks/profile for this session */
  dataOwnerId: string;
  /** True when the viewer is the billing primary (not a household member). */
  isPrimary: boolean;
};

export async function householdContextForUserId(
  viewerId: string,
): Promise<HouseholdContext> {
  const ownerForMember = await getHouseholdOwnerForMember(viewerId);
  if (ownerForMember) {
    return {
      viewerId,
      dataOwnerId: ownerForMember,
      isPrimary: false,
    };
  }
  return { viewerId, dataOwnerId: viewerId, isPrimary: true };
}

export type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export function roleFromUser(user: ClerkUser | null): AppRole {
  const r = user?.publicMetadata?.role;
  if (r === "admin") return "admin";
  return "user";
}

/** Billing / plan features are bypassed for these Clerk `publicMetadata.role` values. */
export function roleGrantsAllFeatures(user: ClerkUser | null): boolean {
  const r = user?.publicMetadata?.role;
  return r === "admin" || r === "friend";
}

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function resolveHouseholdContext(): Promise<HouseholdContext> {
  const viewerId = await requireUserId();
  return householdContextForUserId(viewerId);
}

export async function requireAdminUser(): Promise<ClerkUser> {
  const user = await currentUser();
  if (!user || roleFromUser(user) !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}
