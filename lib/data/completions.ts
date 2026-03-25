import type { Collection, Document, ObjectId, WithId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import type { CompletionDoc } from "@/lib/types";

function col(): Promise<Collection<CompletionDoc & Document>> {
  return getDb().then((db) => db.collection("completions"));
}

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
