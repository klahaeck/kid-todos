import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function assertChildNotDeleted(
  ctx: QueryCtx | MutationCtx,
  ownerUserId: string,
  childId: string,
): Promise<void> {
  const deleted = await ctx.db.query("deletedChildren")
    .withIndex("by_ownerUserId_and_childId", (q) =>
      q.eq("ownerUserId", ownerUserId).eq("childId", childId))
    .unique();
  if (deleted) throw new Error("This child is being deleted or has been removed.");
}

/** Tombstone prevents concurrent clients from creating new work during cleanup. */
export async function deleteChildBatch(ctx: MutationCtx, ownerUserId: string, childId: string) {
  const marker = await ctx.db.query("deletedChildren")
    .withIndex("by_ownerUserId_and_childId", (q) =>
      q.eq("ownerUserId", ownerUserId).eq("childId", childId))
    .unique();
  if (!marker) await ctx.db.insert("deletedChildren", { ownerUserId, childId });
  const batchSize = 250;
  const tasks = await ctx.db.query("tasks")
    .withIndex("by_owner_child", (q) => q.eq("ownerUserId", ownerUserId).eq("childId", childId))
    .take(batchSize);
  const completions = await ctx.db.query("taskCompletions")
    .withIndex("by_ownerUserId_and_childId", (q) => q.eq("ownerUserId", ownerUserId).eq("childId", childId))
    .take(batchSize);
  for (const task of tasks) await ctx.db.delete(task._id);
  for (const row of completions) await ctx.db.delete(row._id);
  return { done: tasks.length < batchSize && completions.length < batchSize };
}
