import { ObjectId } from "mongodb";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { finalizeHouseholdRevocations, getHouseholdAccessSnapshot, insertHouseholdInvite, prepareHouseholdRevocation, redeemInviteAndAddMember } from "@/lib/data/household";
import { mongoFixture } from "./helpers/mongo-fixture";
import { createChild } from "@/lib/data/children";

vi.mock("@/lib/mongodb", () => ({ ensureIndexes: vi.fn(), getDb: vi.fn(), getMongoClient: vi.fn() }));
let fixture: ReturnType<typeof mongoFixture>;
beforeEach(() => {
  fixture = mongoFixture();
  vi.mocked(getDb).mockResolvedValue(fixture.db);
  vi.mocked(getMongoClient).mockResolvedValue(fixture.client);
  vi.stubEnv("HOUSEHOLD_MAX_MEMBERS", "2");
});
afterEach(() => vi.unstubAllEnvs());
function invite(token: string, email = `${token}@example.com`, owner = "owner") {
  fixture.table("household_invites").push({ _id: new ObjectId(), token, emailNormalized: email, ownerClerkId: owner, createdAt: new Date(), expiresAt: new Date(Date.now() + 100_000) });
  return { token, emailNormalized: email, memberClerkId: token };
}

test("concurrent redemptions enforce the final member slot, leaving the rejected invite redeemable", async () => {
  fixture.table("household_members").push({ _id: new ObjectId(), ownerClerkId: "owner", memberClerkId: "existing", joinedAt: new Date() });
  const first = invite("first");
  const second = invite("second");
  const outcomes = await Promise.all([redeemInviteAndAddMember(first), redeemInviteAndAddMember(second)]);
  expect(outcomes.filter((result) => result.ok)).toHaveLength(1);
  expect(outcomes.filter((result) => !result.ok)).toEqual([{ ok: false, error: expect.stringContaining("member limit") }]);
  expect(fixture.table("household_members")).toHaveLength(2);
  expect(fixture.table("household_invites").filter((row) => row.redeemedAt)).toHaveLength(1);
  expect(fixture.transactionOptions).toContainEqual({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
});

test.each(["members", "invites", "children"])("an account with its own %s cannot join another household", async (kind) => {
  const params = invite("joining");
  if (kind === "members") fixture.table("household_members").push({ ownerClerkId: "joining", memberClerkId: "dependent" });
  if (kind === "invites") invite("dependent", "dependent@example.com", "joining");
  if (kind === "children") fixture.table("children").push({ userId: "joining" });
  await expect(redeemInviteAndAddMember(params)).resolves.toEqual({ ok: false, error: expect.stringContaining("before joining") });
  expect(fixture.table("household_invites")[0].redeemedAt).toBeUndefined();
});

test("expired own invites do not prevent joining and successful redemption can retry synchronization", async () => {
  const params = invite("joining");
  invite("expired", "expired@example.com", "joining");
  fixture.table("household_invites")[1].expiresAt = new Date(0);
  await expect(redeemInviteAndAddMember(params)).resolves.toEqual({ ok: true, ownerClerkId: "owner" });
  await expect(redeemInviteAndAddMember(params)).resolves.toEqual({ ok: true, ownerClerkId: "owner" });
  expect(fixture.table("household_members")).toHaveLength(1);
});

test("a primary that joined another household cannot redeem old invitations for its former household", async () => {
  const params = invite("joining");
  fixture.table("household_members").push({ ownerClerkId: "grandparent", memberClerkId: "owner" });
  await expect(redeemInviteAndAddMember(params)).resolves.toEqual({ ok: false, error: expect.stringContaining("no longer a household primary") });
});

test("removals retain a durable row until acknowledged and stale finalization preserves a later membership", async () => {
  const id = new ObjectId();
  fixture.table("household_members").push({ _id: id, ownerClerkId: "owner", memberClerkId: "member", joinedAt: new Date() });
  await prepareHouseholdRevocation("owner", "member");
  const first = await getHouseholdAccessSnapshot("owner");
  expect(first.memberClerkIds).toEqual([]);
  expect(first.revocations).toEqual([{ memberClerkId: "member", revision: 1 }]);
  expect(fixture.table("household_members")).toHaveLength(1);
  await prepareHouseholdRevocation("owner", "member");
  const retry = await getHouseholdAccessSnapshot("owner");
  expect(retry.revision).toBe(2);
  expect(retry.revocations).toEqual(first.revocations);
  await finalizeHouseholdRevocations(retry);
  expect(fixture.table("household_members")).toEqual([]);
  fixture.table("household_members").push({ _id: new ObjectId(), ownerClerkId: "owner", memberClerkId: "member", joinedAt: new Date() });
  await finalizeHouseholdRevocations(first);
  expect(fixture.table("household_members")).toHaveLength(1);
});

test("invite creation rechecks primary status and duplicate/pending limits transactionally", async () => {
  const args = { ownerClerkId: "owner", emailNormalized: "member@example.com" };
  await insertHouseholdInvite(args);
  await expect(insertHouseholdInvite(args)).rejects.toThrow("already pending");
  vi.stubEnv("HOUSEHOLD_MAX_PENDING_INVITES", "1");
  await expect(insertHouseholdInvite({ ...args, emailNormalized: "other@example.com" })).rejects.toThrow("Too many pending");
  fixture.table("household_members").push({ ownerClerkId: "another", memberClerkId: "owner" });
  await expect(insertHouseholdInvite(args)).rejects.toThrow("Only the primary");
});

test("child creation racing with household joining cannot leave a nested household", async () => {
  const params = invite("joining");
  const outcomes = await Promise.allSettled([
    redeemInviteAndAddMember(params),
    createChild("joining", "Sam"),
  ]);
  const joined = fixture.table("household_members").some((row) => row.memberClerkId === "joining");
  const ownsChildren = fixture.table("children").some((row) => row.userId === "joining");
  expect(joined).toBe(!ownsChildren);
  expect(outcomes[0]).toMatchObject({ status: "fulfilled", value: { ok: joined } });
  expect(outcomes[1].status).toBe(joined ? "rejected" : "fulfilled");
});
