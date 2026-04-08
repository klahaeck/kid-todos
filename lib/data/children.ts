import type { Collection, Document, ObjectId, WithId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import type { ChildDoc, ChildDTO } from "@/lib/types";

function col(): Promise<Collection<ChildDoc & Document>> {
  return getDb().then((db) => db.collection("children"));
}

export function childToDTO(c: WithId<ChildDoc>): ChildDTO {
  return {
    id: c._id.toHexString(),
    userId: c.userId,
    name: c.name,
    emoji: c.emoji ?? null,
    sortOrder: c.sortOrder,
    hiddenOnDashboard: c.hiddenOnDashboard === true,
    morningStart: c.morningStart,
    morningEnd: null,
    eveningStart: c.eveningStart,
    eveningEnd: null,
  };
}

export async function listChildrenForUser(
  userId: string,
): Promise<WithId<ChildDoc>[]> {
  await ensureIndexes();
  const c = await col();
  return c.find({ userId }).sort({ sortOrder: 1, name: 1 }).toArray();
}

export async function createChild(
  userId: string,
  name: string,
  emoji?: string,
): Promise<WithId<ChildDoc>> {
  await ensureIndexes();
  const c = await col();
  const last = await c.find({ userId }).sort({ sortOrder: -1 }).limit(1).next();
  const sortOrder = (last?.sortOrder ?? -1) + 1;
  const now = new Date();
  const normalizedEmoji = emoji?.trim() || null;
  const doc: Omit<ChildDoc, "_id"> = {
    userId,
    name,
    emoji: normalizedEmoji,
    sortOrder,
    morningStart: null,
    morningEnd: null,
    eveningStart: null,
    eveningEnd: null,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await c.insertOne(doc as ChildDoc & Document);
  const created = await c.findOne({ _id: insertedId });
  if (!created) throw new Error("Failed to create child");
  return created;
}

export async function getChildForUser(
  userId: string,
  childId: ObjectId,
): Promise<WithId<ChildDoc> | null> {
  await ensureIndexes();
  const c = await col();
  return c.findOne({ _id: childId, userId });
}

export async function updateChildForUser(
  userId: string,
  childId: ObjectId,
  patch: Partial<{
    name: string;
    emoji: string | null;
    hiddenOnDashboard: boolean;
    morningStart: string | null;
    morningEnd: string | null;
    eveningStart: string | null;
    eveningEnd: string | null;
  }>,
): Promise<WithId<ChildDoc> | null> {
  await ensureIndexes();
  const c = await col();
  const res = await c.findOneAndUpdate(
    { _id: childId, userId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return res ?? null;
}

export async function deleteChildForUser(
  userId: string,
  childId: ObjectId,
): Promise<boolean> {
  await ensureIndexes();
  const c = await col();
  const r = await c.deleteOne({ _id: childId, userId });
  return r.deletedCount === 1;
}

export async function reorderChildrenForUser(
  userId: string,
  orderedHexIds: string[],
): Promise<void> {
  await ensureIndexes();
  const { ObjectId } = await import("mongodb");
  const c = await col();
  const ids = orderedHexIds.map((id) => new ObjectId(id));
  for (let i = 0; i < ids.length; i++) {
    const r = await c.updateOne(
      { _id: ids[i], userId },
      { $set: { sortOrder: i, updatedAt: new Date() } },
    );
    if (r.matchedCount !== 1) {
      throw new Error("Invalid child id for this user");
    }
  }
}

export async function listAllChildren(): Promise<WithId<ChildDoc>[]> {
  await ensureIndexes();
  const c = await col();
  return c.find({}).sort({ userId: 1, sortOrder: 1 }).toArray();
}
