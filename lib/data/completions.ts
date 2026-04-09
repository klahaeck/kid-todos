import type { Collection, Document, ObjectId, WithId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import type { CompletionDoc } from "@/lib/types";

function col(): Promise<Collection<CompletionDoc & Document>> {
  return getDb().then((db) => db.collection("completions"));
}

type CompletionsByUserDateSpec = {
  userId: string;
  date: string;
  childIds: ObjectId[];
};

export async function listCompletionsForDay(
  userId: string,
  date: string,
  childIds: ObjectId[],
): Promise<WithId<CompletionDoc>[]> {
  if (childIds.length === 0) return [];
  await ensureIndexes();
  const c = await col();
  return c
    .find({
      userId,
      date,
      childId: { $in: childIds },
    })
    .toArray();
}

export async function listCompletionsForUsersOnDates(
  specs: CompletionsByUserDateSpec[],
): Promise<Map<string, WithId<CompletionDoc>[]>> {
  const filteredSpecs = specs.filter((spec) => spec.childIds.length > 0);
  if (filteredSpecs.length === 0) return new Map();

  await ensureIndexes();
  const c = await col();

  const userIds = [...new Set(filteredSpecs.map((spec) => spec.userId))];
  const dates = [...new Set(filteredSpecs.map((spec) => spec.date))];
  const childIds = [
    ...new Map(
      filteredSpecs
        .flatMap((spec) => spec.childIds)
        .map((childId) => [childId.toHexString(), childId] as const),
    ).values(),
  ];

  const allowedChildIdsByUserDate = new Map<string, Set<string>>();
  for (const spec of filteredSpecs) {
    allowedChildIdsByUserDate.set(
      `${spec.userId}\0${spec.date}`,
      new Set(spec.childIds.map((childId) => childId.toHexString())),
    );
  }

  const completions = await c
    .find({
      userId: { $in: userIds },
      date: { $in: dates },
      childId: { $in: childIds },
    })
    .toArray();

  const byUserDate = new Map<string, WithId<CompletionDoc>[]>();
  for (const completion of completions) {
    const key = `${completion.userId}\0${completion.date}`;
    const allowedChildIds = allowedChildIdsByUserDate.get(key);
    if (!allowedChildIds?.has(completion.childId.toHexString())) continue;

    const list = byUserDate.get(key) ?? [];
    list.push(completion);
    byUserDate.set(key, list);
  }

  return byUserDate;
}

export async function toggleCompletion(
  userId: string,
  childId: ObjectId,
  taskId: ObjectId,
  date: string,
): Promise<{ completed: boolean }> {
  await ensureIndexes();
  const c = await col();
  const existing = await c.findOne({ taskId, date });
  if (existing) {
    if (existing.userId !== userId || !existing.childId.equals(childId)) {
      throw new Error("Forbidden");
    }
    await c.deleteOne({ _id: existing._id });
    return { completed: false };
  }
  const now = new Date();
  await c.insertOne({
    childId,
    taskId,
    userId,
    date,
    completedAt: now,
  } as CompletionDoc & Document);
  return { completed: true };
}

export async function deleteCompletionsForChild(childId: ObjectId): Promise<void> {
  await ensureIndexes();
  const c = await col();
  await c.deleteMany({ childId });
}
