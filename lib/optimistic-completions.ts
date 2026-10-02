import type { OptimisticLocalStore } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function optimisticToggleCompletion(store: OptimisticLocalStore, args: {
  ownerUserId: string;
  childId: string;
  taskId: Id<"tasks">;
  date: string;
}): void {
  for (const query of store.getAllQueries(api.completions.listForDay)) {
    if (query.args.ownerUserId !== args.ownerUserId || query.args.date !== args.date ||
        !query.args.childIds.includes(args.childId) || query.value === undefined) continue;
    const completed = query.value.some((entry) => entry.taskId === args.taskId);
    const next = completed
      ? query.value.filter((entry) => entry.taskId !== args.taskId)
      : [...query.value, { childId: args.childId, taskId: String(args.taskId) }];
    store.setQuery(api.completions.listForDay, query.args, next);
  }
}
