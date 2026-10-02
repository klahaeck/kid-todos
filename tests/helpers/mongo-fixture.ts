import { ObjectId, type ClientSession, type Db, type MongoClient } from "mongodb";

type Row = Record<string, unknown>;
type Filter = Record<string, unknown>;
function equals(a: unknown, b: unknown): boolean {
  if (a instanceof ObjectId && b instanceof ObjectId) return a.equals(b);
  return a === b;
}
function matches(row: Row, filter: Filter): boolean {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === "object" && !(value instanceof ObjectId) && !(value instanceof Date)) {
      const operators = value as Record<string, unknown>;
      if ("$exists" in operators && (row[key] !== undefined) !== operators.$exists) return false;
      if ("$gt" in operators && !((row[key] as Date) > (operators.$gt as Date))) return false;
      return true;
    }
    return equals(row[key], value);
  });
}

/** Serial transaction fixture with rollback; no remote database is contacted. */
export function mongoFixture() {
  const rows = new Map<string, Row[]>();
  const transactionOptions: unknown[] = [];
  const sessions: unknown[] = [];
  let queue = Promise.resolve();
  const table = (name: string) => {
    if (!rows.has(name)) rows.set(name, []);
    return rows.get(name)!;
  };
  const db = {
    collection(name: string) {
      return {
        async findOne(filter: Filter) { return table(name).find((row) => matches(row, filter)) ?? null; },
        find(filter: Filter) {
          let result = table(name).filter((row) => matches(row, filter));
          const cursor = {
            sort(order: Record<string, number>) {
              result.sort((a, b) => {
                for (const [key, direction] of Object.entries(order)) {
                  const difference = Number(a[key]) - Number(b[key]);
                  if (difference) return difference * direction;
                }
                return 0;
              });
              return cursor;
            },
            limit(count: number) { result = result.slice(0, count); return cursor; },
            async next() { return result[0] ?? null; },
            async toArray() { return result; },
          };
          return cursor;
        },
        async countDocuments(filter: Filter) { return table(name).filter((row) => matches(row, filter)).length; },
        async insertOne(doc: Row) {
          const row = { ...doc, _id: doc._id ?? new ObjectId() };
          table(name).push(row);
          return { insertedId: row._id };
        },
        async updateOne(filter: Filter, update: { $set: Row }) {
          const row = table(name).find((row) => matches(row, filter));
          if (row) Object.assign(row, update.$set);
          return { modifiedCount: row ? 1 : 0 };
        },
        async findOneAndUpdate(filter: Filter, update: { $inc: Record<string, number> }, options: { upsert: boolean }) {
          let row = table(name).find((row) => matches(row, filter));
          if (!row && options.upsert) { row = { ...filter }; table(name).push(row); }
          if (!row) return null;
          for (const [key, delta] of Object.entries(update.$inc)) row[key] = Number(row[key] ?? 0) + delta;
          return row;
        },
        async deleteOne(filter: Filter) {
          const index = table(name).findIndex((row) => matches(row, filter));
          if (index >= 0) table(name).splice(index, 1);
          return { deletedCount: index >= 0 ? 1 : 0 };
        },
      };
    },
  } as unknown as Db;
  const client = {
    startSession() {
      const session = {
        async withTransaction<T>(work: () => Promise<T>, options: unknown): Promise<T> {
          transactionOptions.push(options);
          const previous = queue;
          let release!: () => void;
          queue = new Promise<void>((resolve) => { release = resolve; });
          await previous;
          const backup = new Map([...rows].map(([name, documents]) => [name, documents.map((row) => ({ ...row }))]));
          try { return await work(); }
          catch (error) { rows.clear(); for (const [name, documents] of backup) rows.set(name, documents); throw error; }
          finally { release(); }
        },
        async endSession() {},
      } as unknown as ClientSession;
      sessions.push(session);
      return session;
    },
  } as unknown as MongoClient;
  return { db, client, table, transactionOptions, sessions };
}
