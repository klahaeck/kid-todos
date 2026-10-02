import { beforeEach, expect, test, vi } from "vitest";
import { fetchMutation } from "convex/nextjs";
import { convexSyncOwnerMembersFromMongo } from "@/lib/convex-household-sync";
import { finalizeHouseholdRevocations, getHouseholdAccessSnapshot } from "@/lib/data/household";

vi.mock("convex/nextjs", () => ({ fetchMutation: vi.fn() }));
vi.mock("@/lib/convex-server-secret", () => ({ getConvexServerSecret: () => "secret" }));
vi.mock("@/lib/data/household", () => ({ finalizeHouseholdRevocations: vi.fn(), getHouseholdAccessSnapshot: vi.fn() }));
const snapshot = { ownerClerkId: "owner", revision: 2, memberClerkIds: [], revocations: [{ memberClerkId: "removed", revision: 2 }] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getHouseholdAccessSnapshot).mockResolvedValue(snapshot);
});
test("failed sync does not finalize removal; the same pending operation can retry", async () => {
  vi.mocked(fetchMutation).mockRejectedValueOnce(new Error("offline"));
  await expect(convexSyncOwnerMembersFromMongo("owner")).rejects.toThrow("offline");
  expect(finalizeHouseholdRevocations).not.toHaveBeenCalled();
  await convexSyncOwnerMembersFromMongo("owner");
  expect(fetchMutation).toHaveBeenLastCalledWith(expect.anything(), {
    secret: "secret", ownerClerkId: "owner", revision: 2, memberClerkIds: [],
  });
  expect(finalizeHouseholdRevocations).toHaveBeenCalledWith(snapshot);
});
