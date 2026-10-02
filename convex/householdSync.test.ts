/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
beforeEach(() => vi.stubEnv("CONVEX_SERVER_SECRET", "test-secret"));
afterEach(() => vi.unstubAllEnvs());

test("older and duplicate snapshots cannot restore a removed member", async () => {
  const t = convexTest(schema, modules);
  const sync = (revision: number, memberClerkIds: string[]) => t.mutation(api.householdSync.syncOwnerMembersFromServer, {
    secret: "test-secret", ownerClerkId: "owner", revision, memberClerkIds,
  });
  await sync(1, ["member", "member"]);
  const member = t.withIdentity({ subject: "member" });
  await expect(member.query(api.tasks.listForOwner, { ownerUserId: "owner", childIds: [] })).resolves.toEqual([]);
  await sync(2, []);
  await expect(sync(1, ["member"])).resolves.toEqual({ applied: false, revision: 2 });
  await expect(sync(2, ["member"])).resolves.toEqual({ applied: false, revision: 2 });
  await expect(member.query(api.tasks.listForOwner, { ownerUserId: "owner", childIds: [] })).rejects.toThrow("Forbidden");
  expect(await t.run((ctx) => ctx.db.query("householdAccess").collect())).toEqual([]);
});

test("revisions are scoped to each owner and synchronization requires the server secret", async () => {
  const t = convexTest(schema, modules);
  const args = { secret: "test-secret", ownerClerkId: "owner", revision: 10, memberClerkIds: ["member"] };
  await expect(t.mutation(api.householdSync.syncOwnerMembersFromServer, { ...args, secret: "wrong" })).rejects.toThrow("Unauthorized");
  await t.mutation(api.householdSync.syncOwnerMembersFromServer, args);
  await t.mutation(api.householdSync.syncOwnerMembersFromServer, { ...args, ownerClerkId: "other", revision: 0 });
  expect(await t.run((ctx) => ctx.db.query("householdAccess").collect())).toHaveLength(2);
  await expect(t.mutation(api.householdSync.syncOwnerMembersFromServer, { ...args, revision: -1 })).rejects.toThrow("Invalid household revision");
});
