import { mutation } from "./_generated/server";
import { v } from "convex/values";

function requireServerSecret(secret: string): void {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

/** Called from Next.js after Mongo confirms a household membership row exists. */
export const grantAccessFromServer = mutation({
  args: {
    secret: v.string(),
    memberClerkId: v.string(),
    ownerClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const existing = await ctx.db
      .query("householdAccess")
      .withIndex("by_member_owner", (q) =>
        q.eq("memberClerkId", args.memberClerkId).eq("ownerClerkId", args.ownerClerkId),
      )
      .first();
    if (existing) {
      return { ok: true as const, id: existing._id };
    }
    const id = await ctx.db.insert("householdAccess", {
      memberClerkId: args.memberClerkId,
      ownerClerkId: args.ownerClerkId,
    });
    return { ok: true as const, id };
  },
});

export const revokeAccessFromServer = mutation({
  args: {
    secret: v.string(),
    memberClerkId: v.string(),
    ownerClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const existing = await ctx.db
      .query("householdAccess")
      .withIndex("by_member_owner", (q) =>
        q.eq("memberClerkId", args.memberClerkId).eq("ownerClerkId", args.ownerClerkId),
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { ok: true as const };
  },
});

/** Idempotent sync of all Mongo household members for one owner (repair / backfill). */
export const syncOwnerMembersFromServer = mutation({
  args: {
    secret: v.string(),
    ownerClerkId: v.string(),
    memberClerkIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.secret);
    const desired = new Set(args.memberClerkIds);
    const existing = await ctx.db
      .query("householdAccess")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", args.ownerClerkId))
      .collect();
    for (const row of existing) {
      if (!desired.has(row.memberClerkId)) {
        await ctx.db.delete(row._id);
      }
    }
    for (const memberClerkId of desired) {
      const hit = await ctx.db
        .query("householdAccess")
        .withIndex("by_member_owner", (q) =>
          q.eq("memberClerkId", memberClerkId).eq("ownerClerkId", args.ownerClerkId),
        )
        .first();
      if (!hit) {
        await ctx.db.insert("householdAccess", {
          ownerClerkId: args.ownerClerkId,
          memberClerkId,
        });
      }
    }
    return { ok: true as const };
  },
});
