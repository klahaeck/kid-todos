import { ObjectId } from "mongodb";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { entitlementsForBillingUser, getSubscriptionAccess, hasAllRoutinesFeature } from "@/lib/subscription";
import { getHouseholdOwnerForMember } from "@/lib/data/household";
import { getHouseholdEntitlementsForOwner, upsertHouseholdEntitlementsFromPrimary } from "@/lib/data/household-entitlements";
import type { HouseholdEntitlementsDoc } from "@/lib/types";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), currentUser: vi.fn(), clerkClient: vi.fn() }));
vi.mock("@/lib/data/household", () => ({ getHouseholdOwnerForMember: vi.fn() }));
vi.mock("@/lib/data/household-entitlements", async (importOriginal) => {
  // Load only the pure conversion function; Mongo is mocked below.
  const actual = await importOriginal<typeof import("@/lib/data/household-entitlements")>();
  return { ...actual, getHouseholdEntitlementsForOwner: vi.fn(), upsertHouseholdEntitlementsFromPrimary: vi.fn() };
});
vi.mock("@/lib/mongodb", () => ({ getDb: vi.fn(), ensureIndexes: vi.fn() }));
const paid = { isMonthlySubscriber: true, hasMultipleChildrenFeature: true, hasAllRoutinesFeature: true, hasAllThemesFeature: true, hasMultipleUsersFeature: true };
const getUser = vi.fn();
const getSubscription = vi.fn();
const sessionHas = vi.fn();
function cache(age: number): HouseholdEntitlementsDoc {
  return { ...paid, _id: new ObjectId(), ownerClerkId: "owner", updatedAt: new Date(Date.now() - age) };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
  vi.mocked(clerkClient).mockResolvedValue({ users: { getUser }, billing: { getUserBillingSubscription: getSubscription } } as unknown as Awaited<ReturnType<typeof clerkClient>>);
  getUser.mockResolvedValue({ publicMetadata: {} });
  vi.mocked(auth).mockResolvedValue({ userId: "owner", isAuthenticated: true, has: sessionHas } as unknown as Awaited<ReturnType<typeof auth>>);
  vi.mocked(currentUser).mockResolvedValue({ publicMetadata: {}, privateMetadata: {} } as unknown as Awaited<ReturnType<typeof currentUser>>);
  vi.mocked(getHouseholdOwnerForMember).mockResolvedValue(null);
  sessionHas.mockReturnValue(false);
  getSubscription.mockResolvedValue({ status: "ended", subscriptionItems: [] });
});
afterEach(() => vi.useRealTimers());
test("fresh cache avoids a billing round trip", async () => {
  vi.mocked(getHouseholdEntitlementsForOwner).mockResolvedValue(cache(59_999));
  expect(await entitlementsForBillingUser("owner")).toEqual(paid);
  expect(getUser).not.toHaveBeenCalled();
});
test.each([60_000, 14 * 24 * 60 * 60 * 1000])("expired cache refreshes and records loss of paid access (%i ms)", async (age) => {
  vi.mocked(getHouseholdEntitlementsForOwner).mockResolvedValue(cache(age));
  const ent = await entitlementsForBillingUser("owner");
  expect(Object.values(ent)).toEqual([false, false, false, false, false]);
  expect(getSubscription).toHaveBeenCalledWith("owner");
  expect(upsertHouseholdEntitlementsFromPrimary).toHaveBeenCalledWith("owner", ent);
});
test("billing failure never falls back to expired paid entitlements", async () => {
  vi.mocked(getHouseholdEntitlementsForOwner).mockResolvedValue(cache(60_000));
  getSubscription.mockRejectedValue(new Error("offline"));
  expect(Object.values(await entitlementsForBillingUser("owner"))).toEqual([false, false, false, false, false]);
});
test("the primary's explicit role grant survives a cache refresh", async () => {
  vi.mocked(getHouseholdEntitlementsForOwner).mockResolvedValue(null);
  getUser.mockResolvedValue({ publicMetadata: { role: "friend" } });
  expect(await entitlementsForBillingUser("owner")).toEqual(paid);
  expect(getSubscription).not.toHaveBeenCalled();
});

test.each([true, false, undefined, "true"])("only a strict private metadata true grants complimentary access (%s)", async (grant) => {
  vi.mocked(currentUser).mockResolvedValue({ publicMetadata: {}, privateMetadata: { complimentaryAccess: grant } } as never);
  const access = await getSubscriptionAccess();
  expect(access.hasAllRoutinesFeature).toBe(grant === true);
  expect(upsertHouseholdEntitlementsFromPrimary).toHaveBeenCalledWith("owner", grant === true ? paid : expect.objectContaining({ hasAllRoutinesFeature: false }));
  expect(getUser).not.toHaveBeenCalled();
});

test("the primary's complimentary grant is reused by feature helpers and snapshots", async () => {
  vi.mocked(currentUser).mockResolvedValue({ publicMetadata: {}, privateMetadata: { complimentaryAccess: true } } as never);
  expect(await hasAllRoutinesFeature()).toBe(true);
  expect(currentUser).toHaveBeenCalledTimes(1);
  expect(getUser).not.toHaveBeenCalled();
  expect(upsertHouseholdEntitlementsFromPrimary).toHaveBeenCalledWith("owner", paid);
});

test("a household member inherits the billing primary's complimentary grant", async () => {
  vi.mocked(auth).mockResolvedValue({ userId: "member", isAuthenticated: true, has: sessionHas } as never);
  vi.mocked(getHouseholdOwnerForMember).mockResolvedValue("owner");
  vi.mocked(getHouseholdEntitlementsForOwner).mockResolvedValue(null);
  getUser.mockResolvedValue({ publicMetadata: {}, privateMetadata: { complimentaryAccess: true } });
  expect((await getSubscriptionAccess()).hasAllRoutinesFeature).toBe(true);
  expect(getUser).toHaveBeenCalledTimes(1);
});

test("a member's own complimentary flag does not grant household access", async () => {
  vi.mocked(auth).mockResolvedValue({ userId: "member", isAuthenticated: true, has: sessionHas } as never);
  vi.mocked(getHouseholdOwnerForMember).mockResolvedValue("owner");
  vi.mocked(currentUser).mockResolvedValue({ publicMetadata: {}, privateMetadata: { complimentaryAccess: true } } as never);
  vi.mocked(getHouseholdEntitlementsForOwner).mockResolvedValue(null);
  getUser.mockResolvedValue({ publicMetadata: {}, privateMetadata: {} });
  expect((await getSubscriptionAccess()).hasAllRoutinesFeature).toBe(false);
});

test("a failed owner lookup does not persist a false snapshot", async () => {
  vi.mocked(getHouseholdEntitlementsForOwner).mockResolvedValue(null);
  getUser.mockRejectedValue(new Error("Clerk unavailable"));
  expect(Object.values(await entitlementsForBillingUser("owner"))).toEqual([false, false, false, false, false]);
  expect(upsertHouseholdEntitlementsFromPrimary).not.toHaveBeenCalled();
});

test("viewer role grants remain effective for household members", async () => {
  vi.mocked(auth).mockResolvedValue({ userId: "member", isAuthenticated: true, has: sessionHas } as never);
  vi.mocked(getHouseholdOwnerForMember).mockResolvedValue("owner");
  vi.mocked(currentUser).mockResolvedValue({ publicMetadata: { role: "friend" }, privateMetadata: {} } as never);
  expect((await getSubscriptionAccess()).hasAllRoutinesFeature).toBe(true);
  expect(upsertHouseholdEntitlementsFromPrimary).not.toHaveBeenCalled();
});
