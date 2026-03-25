import type { Collection, Document, ObjectId, WithId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import type { Routine, TaskDoc, TaskDTO } from "@/lib/types";

function col(): Promise<Collection<TaskDoc & Document>> {
  return getDb().then((db) => db.collection("tasks"));
}

export function taskToDTO(t: WithId<TaskDoc>): TaskDTO {
  return {
    id: t._id.toHexString(),
    childId: t.childId.toHexString(),
    userId: t.userId,
    title: t.title,
    routine: t.routine,
    sortOrder: t.sortOrder,
    active: t.active,
  };
}

export async function listTasksForChild(
  userId: string,
  childId: ObjectId,
): Promise<WithId<TaskDoc>[]> {
  await ensureIndexes();
  const c = await col();
  const arr = await c.find({ childId, userId, active: true }).toArray();
  return sortTasksByRoutine(arr);
}

export async function listTasksForChildAdmin(
  childId: ObjectId,
): Promise<WithId<TaskDoc>[]> {
  await ensureIndexes();
  const c = await col();
  const arr = await c.find({ childId, active: true }).toArray();
  return sortTasksByRoutine(arr);
}

function routineOrder(r: Routine): number {
  return r === "morning" ? 0 : 1;
}

function sortTasksByRoutine<T extends { routine: Routine; sortOrder: number; title: string }>(
  arr: T[],
): T[] {
  return [...arr].sort((a, b) => {
    const d = routineOrder(a.routine) - routineOrder(b.routine);
    if (d !== 0) return d;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

export async function createTask(
  userId: string,
  childId: ObjectId,
  title: string,
  routine: Routine,
): Promise<WithId<TaskDoc>> {
  await ensureIndexes();
  const c = await col();
  const last = await c
    .find({ childId, userId, routine })
    .sort({ sortOrder: -1 })
    .limit(1)
    .next();
  const sortOrder = (last?.sortOrder ?? -1) + 1;
  const now = new Date();
  const doc: Omit<TaskDoc, "_id"> = {
    childId,
    userId,
    title,
    routine,
    sortOrder,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await c.insertOne(doc as TaskDoc & Document);
  const created = await c.findOne({ _id: insertedId });
  if (!created) throw new Error("Failed to create task");
  return created;
}

export async function getTaskForUser(
  userId: string,
  taskId: ObjectId,
): Promise<WithId<TaskDoc> | null> {
  await ensureIndexes();
  const c = await col();
  return c.findOne({ _id: taskId, userId });
}

export async function updateTaskForUser(
  userId: string,
  taskId: ObjectId,
  patch: Partial<{ title: string; routine: Routine; active: boolean }>,
): Promise<WithId<TaskDoc> | null> {
  await ensureIndexes();
  const c = await col();
  const res = await c.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return res ?? null;
}

export async function deleteTaskForUser(
  userId: string,
  taskId: ObjectId,
): Promise<boolean> {
  await ensureIndexes();
  const c = await col();
  const r = await c.deleteOne({ _id: taskId, userId });
  return r.deletedCount === 1;
}

export async function reorderTasksForUser(
  userId: string,
  childId: ObjectId,
  orderedHexIds: string[],
): Promise<void> {
  await ensureIndexes();
  const { ObjectId } = await import("mongodb");
  const c = await col();
  const ids = orderedHexIds.map((id) => new ObjectId(id));
  for (let i = 0; i < ids.length; i++) {
    const r = await c.updateOne(
      { _id: ids[i], userId, childId },
      { $set: { sortOrder: i, updatedAt: new Date() } },
    );
    if (r.matchedCount !== 1) {
      throw new Error("Invalid task id for this child");
    }
  }
}

export async function deleteTasksForChild(childId: ObjectId): Promise<void> {
  await ensureIndexes();
  const c = await col();
  await c.deleteMany({ childId });
}
