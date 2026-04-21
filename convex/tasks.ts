import type { MutationCtx, QueryCtx } from "./_generated/server";
import { query, mutation } from "./_generated/server";
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

function routineOrder(r: "morning" | "evening"): number {
  return r === "morning" ? 0 : 1;
}

function sortTasksForClient<
  T extends {
    routine: "morning" | "evening";
    sortOrder: number;
    title: string;
  },
>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const d = routineOrder(a.routine) - routineOrder(b.routine);
    if (d !== 0) return d;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

function requireServerSecret(secret: string): void {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const listForOwner = query({
  args: {
    ownerUserId: v.string(),
    childIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    if (args.childIds.length === 0) {
      return [] as {
        id: string;
        childId: string;
        userId: string;
        title: string;
        routine: "morning" | "evening";
        sortOrder: number;
        active: boolean;
      }[];
    }
    const allowed = new Set(args.childIds);
    const rows = await ctx.db
      .query("tasks")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", args.ownerUserId))
      .collect();
    const filtered = rows.filter(
      (t) => t.active && allowed.has(t.childId),
    );
    const sorted = sortTasksForClient(filtered);
    return sorted.map((t) => ({
      id: t._id,
      childId: t.childId,
      userId: t.ownerUserId,
      title: t.title,
      routine: t.routine,
      sortOrder: t.sortOrder,
      active: t.active,
    }));
  },
});

export const getForOwner = query({
  args: {
    ownerUserId: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerUserId !== args.ownerUserId) {
      return null;
    }
    return {
      id: task._id,
      childId: task.childId,
      userId: task.ownerUserId,
      title: task.title,
      routine: task.routine,
      sortOrder: task.sortOrder,
      active: task.active,
    };
  },
});

export const create = mutation({
  args: {
    ownerUserId: v.string(),
    childId: v.string(),
    title: v.string(),
    routine: v.union(v.literal("morning"), v.literal("evening")),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const title = args.title.trim();
    if (!title) {
      throw new Error("Title required");
    }
    const sameRoutine = await ctx.db
      .query("tasks")
      .withIndex("by_owner_child", (q) =>
        q.eq("ownerUserId", args.ownerUserId).eq("childId", args.childId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("routine"), args.routine),
          q.eq(q.field("active"), true),
        ),
      )
      .collect();
    let maxOrder = -1;
    for (const t of sameRoutine) {
      if (t.sortOrder > maxOrder) maxOrder = t.sortOrder;
    }
    const now = Date.now();
    const id = await ctx.db.insert("tasks", {
      ownerUserId: args.ownerUserId,
      childId: args.childId,
      title,
      routine: args.routine,
      sortOrder: maxOrder + 1,
      active: true,
      updatedAt: now,
    });
    const created = await ctx.db.get(id);
    if (!created) throw new Error("Failed to create task");
    return {
      id: created._id,
      childId: created.childId,
      userId: created.ownerUserId,
      title: created.title,
      routine: created.routine,
      sortOrder: created.sortOrder,
      active: created.active,
    };
  },
});

export const update = mutation({
  args: {
    ownerUserId: v.string(),
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    routine: v.optional(v.union(v.literal("morning"), v.literal("evening"))),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerUserId !== args.ownerUserId) {
      throw new Error("Task not found");
    }
    const patch: {
      title?: string;
      routine?: "morning" | "evening";
      active?: boolean;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.title !== undefined) {
      const t = args.title.trim();
      if (!t) throw new Error("Title required");
      patch.title = t;
    }
    if (args.routine !== undefined) patch.routine = args.routine;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.taskId, patch);
    const next = await ctx.db.get(args.taskId);
    if (!next) throw new Error("Task not found");
    return {
      id: next._id,
      childId: next.childId,
      userId: next.ownerUserId,
      title: next.title,
      routine: next.routine,
      sortOrder: next.sortOrder,
      active: next.active,
    };
  },
});

export const remove = mutation({
  args: {
    ownerUserId: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerUserId !== args.ownerUserId) {
      return { deleted: false as const };
    }
    await ctx.db.delete(args.taskId);
    return { deleted: true as const, id: String(args.taskId) };
  },
});

export const reorderForChild = mutation({
  args: {
    ownerUserId: v.string(),
    childId: v.string(),
    orderedIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    for (let i = 0; i < args.orderedIds.length; i++) {
      const taskId = args.orderedIds[i]!;
      const task = await ctx.db.get(taskId);
      if (
        !task ||
        task.ownerUserId !== args.ownerUserId ||
        task.childId !== args.childId
      ) {
        throw new Error("Invalid task id for this child");
      }
      await ctx.db.patch(taskId, {
        sortOrder: i,
        updatedAt: Date.now(),
      });
    }
    return { ok: true as const };
  },
});

export const deleteAllForChild = mutation({
  args: {
    ownerUserId: v.string(),
    childId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertCanAccessOwner(ctx, args.ownerUserId);
    const rows = await ctx.db
      .query("tasks")
      .withIndex("by_owner_child", (q) =>
        q.eq("ownerUserId", args.ownerUserId).eq("childId", args.childId),
      )
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { ok: true as const };
  },
});

export const adminListForChildIds = query({
  args: {
    secret: v.string(),
    childIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    if (args.childIds.length === 0) return [];
    const allowed = new Set(args.childIds);
    const all = await ctx.db.query("tasks").collect();
    const filtered = all.filter(
      (t) => t.active && allowed.has(t.childId),
    );
    const sorted = sortTasksForClient(filtered);
    return sorted.map((t) => ({
      id: t._id,
      childId: t.childId,
      userId: t.ownerUserId,
      title: t.title,
      routine: t.routine,
      sortOrder: t.sortOrder,
      active: t.active,
    }));
  },
});

export const adminDeleteTaskForOwner = mutation({
  args: {
    secret: v.string(),
    ownerUserId: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerUserId !== args.ownerUserId) {
      return { deleted: false as const };
    }
    await ctx.db.delete(args.taskId);
    return { deleted: true as const };
  },
});

export const adminCreate = mutation({
  args: {
    secret: v.string(),
    ownerUserId: v.string(),
    childId: v.string(),
    title: v.string(),
    routine: v.union(v.literal("morning"), v.literal("evening")),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const title = args.title.trim();
    if (!title) throw new Error("Title required");
    const sameRoutine = await ctx.db
      .query("tasks")
      .withIndex("by_owner_child", (q) =>
        q.eq("ownerUserId", args.ownerUserId).eq("childId", args.childId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("routine"), args.routine),
          q.eq(q.field("active"), true),
        ),
      )
      .collect();
    let maxOrder = -1;
    for (const t of sameRoutine) {
      if (t.sortOrder > maxOrder) maxOrder = t.sortOrder;
    }
    const now = Date.now();
    const id = await ctx.db.insert("tasks", {
      ownerUserId: args.ownerUserId,
      childId: args.childId,
      title,
      routine: args.routine,
      sortOrder: maxOrder + 1,
      active: true,
      updatedAt: now,
    });
    const created = await ctx.db.get(id);
    if (!created) throw new Error("Failed to create task");
    return {
      id: created._id,
      childId: created.childId,
      userId: created.ownerUserId,
      title: created.title,
      routine: created.routine,
      sortOrder: created.sortOrder,
      active: created.active,
    };
  },
});

export const adminDeleteAllTasksForChild = mutation({
  args: {
    secret: v.string(),
    childId: v.string(),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const rows = await ctx.db.query("tasks").collect();
    for (const row of rows) {
      if (row.childId === args.childId) {
        await ctx.db.delete(row._id);
      }
    }
    return { ok: true as const };
  },
});
