import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

type Ctx = QueryCtx | MutationCtx;

async function assertCanAccessOwner(
  ctx: Ctx,
  ownerUserId: string,
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  const viewer = identity.subject;
  if (viewer === ownerUserId) {
    return;
  }
  const link = await ctx.db
    .query("householdAccess")
    .withIndex("by_member_owner", (q) =>
      q.eq("memberClerkId", viewer).eq("ownerClerkId", ownerUserId),
    )
    .first();
  if (!link) {
    throw new Error("Forbidden");
  }
}

function requireServerSecret(secret: string): void {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const listForDay = query({
  args: {
    ownerUserId: v.string(),
    childIds: v.array(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    if (args.childIds.length === 0) {
      return [] as { childId: string; taskId: string }[];
    }
    const allowedChildIds = new Set(args.childIds);
    const rows = await ctx.db
      .query("taskCompletions")
      .withIndex("by_ownerUserId_and_date", (q) =>
        q.eq("ownerUserId", args.ownerUserId).eq("date", args.date),
      )
      .collect();
    return rows
      .filter((row) => allowedChildIds.has(row.childId))
      .map((row) => ({
        childId: row.childId,
        taskId: String(row.taskId),
      }));
  },
});

export const toggleForDay = mutation({
  args: {
    ownerUserId: v.string(),
    childId: v.string(),
    taskId: v.id("tasks"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const task = await ctx.db.get(args.taskId);
    if (
      !task ||
      task.ownerUserId !== args.ownerUserId ||
      task.childId !== args.childId ||
      !task.active
    ) {
      throw new Error("Task not found");
    }

    const existing = await ctx.db
      .query("taskCompletions")
      .withIndex("by_ownerUserId_and_date_and_taskId", (q) =>
        q
          .eq("ownerUserId", args.ownerUserId)
          .eq("date", args.date)
          .eq("taskId", args.taskId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { completed: false as const };
    }

    await ctx.db.insert("taskCompletions", {
      ownerUserId: args.ownerUserId,
      childId: args.childId,
      taskId: args.taskId,
      date: args.date,
      completedAt: Date.now(),
    });
    return { completed: true as const };
  },
});

export const removeForTask = mutation({
  args: {
    ownerUserId: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const rows = await ctx.db
      .query("taskCompletions")
      .withIndex("by_ownerUserId_and_taskId", (q) =>
        q.eq("ownerUserId", args.ownerUserId).eq("taskId", args.taskId),
      )
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { ok: true as const };
  },
});

export const removeForChild = mutation({
  args: {
    ownerUserId: v.string(),
    childId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const rows = await ctx.db
      .query("taskCompletions")
      .withIndex("by_ownerUserId_and_childId", (q) =>
        q.eq("ownerUserId", args.ownerUserId).eq("childId", args.childId),
      )
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { ok: true as const };
  },
});

export const adminListForOwnerDates = query({
  args: {
    secret: v.string(),
    specs: v.array(
      v.object({
        ownerUserId: v.string(),
        date: v.string(),
        childIds: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const results: {
      ownerUserId: string;
      date: string;
      completions: { childId: string; taskId: string }[];
    }[] = [];
    for (const spec of args.specs) {
      if (spec.childIds.length === 0) {
        results.push({
          ownerUserId: spec.ownerUserId,
          date: spec.date,
          completions: [],
        });
        continue;
      }
      const allowedChildIds = new Set(spec.childIds);
      const rows = await ctx.db
        .query("taskCompletions")
        .withIndex("by_ownerUserId_and_date", (q) =>
          q.eq("ownerUserId", spec.ownerUserId).eq("date", spec.date),
        )
        .collect();
      results.push({
        ownerUserId: spec.ownerUserId,
        date: spec.date,
        completions: rows
          .filter((row) => allowedChildIds.has(row.childId))
          .map((row) => ({
            childId: row.childId,
            taskId: String(row.taskId),
          })),
      });
    }
    return results;
  },
});

export const adminDeleteAllForChild = mutation({
  args: {
    secret: v.string(),
    childId: v.string(),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const rows = await ctx.db
      .query("taskCompletions")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { ok: true as const };
  },
});
