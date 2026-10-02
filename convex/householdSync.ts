import { mutation } from "./_generated/server";
import { v } from "convex/values";

/** Full snapshots are ordered by the authoritative Mongo household revision. */
export const syncOwnerMembersFromServer = mutation({
  args: {
    secret: v.string(),
    ownerClerkId: v.string(),
    revision: v.number(),
    memberClerkIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_SERVER_SECRET;
    if (!expected || args.secret !== expected) throw new Error("Unauthorized");
    if (!Number.isSafeInteger(args.revision) || args.revision < 0) {
      throw new Error("Invalid household revision");
    }
    const state = await ctx.db.query("householdSyncState")
      .withIndex("by_ownerClerkId", (q) => q.eq("ownerClerkId", args.ownerClerkId))
      .unique();
    if (state && args.revision <= state.revision) {
      return { applied: false, revision: state.revision };
    }
    const desired = new Set(args.memberClerkIds);
    const existing = await ctx.db.query("householdAccess")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", args.ownerClerkId))
      .take(1001);
    if (existing.length > 1000 || desired.size > 1000) throw new Error("Too many household members");
    const retained = new Set<string>();
    for (const row of existing) {
      if (!desired.has(row.memberClerkId) || retained.has(row.memberClerkId)) {
        await ctx.db.delete(row._id);
      } else {
        retained.add(row.memberClerkId);
      }
    }
    for (const memberClerkId of desired) {
      if (!retained.has(memberClerkId)) {
        await ctx.db.insert("householdAccess", { ownerClerkId: args.ownerClerkId, memberClerkId });
      }
    }
    if (state) {
      await ctx.db.patch(state._id, { revision: args.revision });
    } else {
      await ctx.db.insert("householdSyncState", { ownerClerkId: args.ownerClerkId, revision: args.revision });
    }
    return { applied: true, revision: args.revision };
  },
});
