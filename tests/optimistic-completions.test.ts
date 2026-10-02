import { expect, test, vi } from "vitest";
import type { OptimisticLocalStore } from "convex/browser";
import type { Id } from "@/convex/_generated/dataModel";
import { optimisticToggleCompletion } from "@/lib/optimistic-completions";

test("completion taps update every matching subscription without changing another owner, date, or child", () => {
  const args = { ownerUserId: "owner", childId: "child", taskId: "task" as Id<"tasks">, date: "2026-10-02" };
  const queries = [
    { args: { ownerUserId: "owner", childIds: ["child"], date: args.date }, value: [] },
    { args: { ownerUserId: "owner", childIds: ["child", "other"], date: args.date }, value: [{ childId: "other", taskId: "other-task" }] },
    { args: { ownerUserId: "other", childIds: ["child"], date: args.date }, value: [] },
    { args: { ownerUserId: "owner", childIds: ["other"], date: args.date }, value: [] },
    { args: { ownerUserId: "owner", childIds: ["child"], date: "2026-10-01" }, value: [] },
    { args: { ownerUserId: "owner", childIds: ["child"], date: args.date }, value: undefined },
  ];
  const setQuery = vi.fn((_ref, queryArgs, value) => {
    queries.find((query) => query.args === queryArgs)!.value = value;
  });
  const store = { getAllQueries: () => queries, setQuery } as unknown as OptimisticLocalStore;
  optimisticToggleCompletion(store, args);
  expect(setQuery).toHaveBeenCalledTimes(2);
  expect(queries[0].value).toEqual([{ childId: "child", taskId: "task" }]);
  expect(queries[1].value).toHaveLength(2);
  optimisticToggleCompletion(store, args);
  expect(queries[0].value).toEqual([]);
  expect(queries[1].value).toEqual([{ childId: "other", taskId: "other-task" }]);
});
