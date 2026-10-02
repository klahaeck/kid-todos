import type { ClientSession, Db } from "mongodb";
import { ensureIndexes, getDb, getMongoClient } from "@/lib/mongodb";

export type HouseholdState = { _id: string; revision: number };

/** Shared writes serialize membership, invite, and child-creation invariants. */
export async function withHouseholdTransaction<T>(
  userIds: string[],
  work: (db: Db, session: ClientSession, revisions: Map<string, number>) => Promise<T>,
): Promise<T> {
  await ensureIndexes();
  const db = await getDb();
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const revisions = new Map<string, number>();
      for (const userId of [...new Set(userIds)].sort()) {
        const state = await db.collection<HouseholdState>("household_states")
          .findOneAndUpdate(
            { _id: userId },
            { $inc: { revision: 1 } },
            { session, upsert: true, returnDocument: "after" },
          );
        if (!state) throw new Error("Could not update household revision.");
        revisions.set(userId, state.revision);
      }
      return work(db, session, revisions);
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
  } finally {
    await session.endSession();
  }
}
