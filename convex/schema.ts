import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  householdAccess: defineTable({
    ownerClerkId: v.string(),
    memberClerkId: v.string(),
  })
    .index("by_member_owner", ["memberClerkId", "ownerClerkId"])
    .index("by_owner", ["ownerClerkId"]),

  tasks: defineTable({
    ownerUserId: v.string(),
    childId: v.string(),
    title: v.string(),
    routine: v.union(v.literal("morning"), v.literal("evening")),
    sortOrder: v.number(),
    active: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_owner_child", ["ownerUserId", "childId"]),
});
