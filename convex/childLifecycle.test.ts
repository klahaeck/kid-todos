/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
beforeEach(() => vi.stubEnv("CONVEX_SERVER_SECRET", "test-secret"));
afterEach(() => vi.unstubAllEnvs());

test("child cleanup is bounded, retryable, and preserves other owners and children", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    for (let i = 0; i < 251; i++) {
      const taskId = await ctx.db.insert("tasks", { ownerUserId: "owner", childId: "child", title: `Task ${i}`, routine: "evening", sortOrder: i, active: true, updatedAt: 0 });
      await ctx.db.insert("taskCompletions", { ownerUserId: "owner", childId: "child", taskId, date: "2026-10-02", completedAt: 0 });
    }
    for (const [ownerUserId, childId] of [["other-owner", "child"], ["owner", "other-child"]]) {
      await ctx.db.insert("tasks", { ownerUserId, childId, title: "Keep me", routine: "evening", sortOrder: 0, active: true, updatedAt: 0 });
    }
  });
  const args = { secret: "test-secret", ownerUserId: "owner", childId: "child" };
  await expect(t.mutation(api.tasks.adminDeleteAllTasksForChild, args)).resolves.toEqual({ done: false });
  expect(await t.run((ctx) => ctx.db.query("taskCompletions").collect())).toHaveLength(1);
  const owner = t.withIdentity({ subject: "owner" });
  const remaining = await t.run((ctx) => ctx.db.query("tasks").withIndex("by_owner_child", (q) => q.eq("ownerUserId", "owner").eq("childId", "child")).unique());
  await expect(owner.mutation(api.tasks.create, { ownerUserId: "owner", childId: "child", title: "New", routine: "evening" })).rejects.toThrow("being deleted");
  await expect(owner.mutation(api.tasks.update, { ownerUserId: "owner", taskId: remaining!._id, title: "Updated" })).rejects.toThrow("being deleted");
  await expect(owner.mutation(api.completions.toggleForDay, { ownerUserId: "owner", childId: "child", taskId: remaining!._id, date: "2026-10-02" })).rejects.toThrow("being deleted");
  await expect(t.mutation(api.tasks.adminDeleteAllTasksForChild, args)).resolves.toEqual({ done: true });
  await expect(t.mutation(api.tasks.adminDeleteAllTasksForChild, args)).resolves.toEqual({ done: true });
  expect(await t.run((ctx) => ctx.db.query("tasks").collect())).toHaveLength(2);
  expect(await t.run((ctx) => ctx.db.query("taskCompletions").collect())).toEqual([]);
});

test("ordinary cleanup enforces household access", async () => {
  const t = convexTest(schema, modules);
  await expect(t.withIdentity({ subject: "stranger" }).mutation(api.tasks.deleteAllForChild, { ownerUserId: "owner", childId: "child" })).rejects.toThrow("Forbidden");
  await expect(t.withIdentity({ subject: "owner" }).mutation(api.tasks.deleteAllForChild, { ownerUserId: "owner", childId: "child" })).resolves.toEqual({ done: true });
});
