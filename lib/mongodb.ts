import { MongoClient, ServerApiVersion, type Db, type MongoClientOptions } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientOptions: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  return uri;
}

let prodClientPromise: Promise<MongoClient> | null = null;

export function getMongoClient(): Promise<MongoClient> {
  const uri = getMongoUri();
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, clientOptions);
      const promise = client.connect().catch((error: unknown) => {
        // Allow the next request to retry after connectivity is restored.
        if (global._mongoClientPromise === promise) {
          global._mongoClientPromise = undefined;
        }
        throw error;
      });
      global._mongoClientPromise = promise;
    }
    return global._mongoClientPromise;
  }
  if (!prodClientPromise) {
    const promise = new MongoClient(uri, clientOptions).connect().catch((error: unknown) => {
      if (prodClientPromise === promise) {
        prodClientPromise = null;
      }
      throw error;
    });
    prodClientPromise = promise;
  }
  return prodClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const name = process.env.MONGODB_DB_NAME ?? "kid-todos";
  return client.db(name);
}

let indexesEnsured = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const db = await getDb();
  await db.collection("profiles").createIndex({ clerkId: 1 }, { unique: true });
  await db.collection("children").createIndex({ userId: 1, sortOrder: 1 });
  await db.collection("completions").createIndex({ userId: 1, date: 1, childId: 1 });
  await db.collection("completions").createIndex({ childId: 1, date: 1 });
  await db
    .collection("completions")
    .createIndex({ taskId: 1, date: 1 }, { unique: true });
  await db
    .collection("task_completion_events")
    .createIndex({ userId: 1, completedAt: -1 });
  await db
    .collection("task_completion_events")
    .createIndex({ userId: 1, calendarDate: -1 });
  await db
    .collection("task_completion_events")
    .createIndex({ childId: 1, completedAt: -1 });
  await db.collection("task_completion_events").createIndex({ taskId: 1 });
  await db
    .collection("household_members")
    .createIndex({ memberClerkId: 1 }, { unique: true });
  await db.collection("household_members").createIndex({ ownerClerkId: 1 });
  await db.collection("household_invites").createIndex({ token: 1 }, { unique: true });
  await db
    .collection("household_invites")
    .createIndex({ ownerClerkId: 1, emailNormalized: 1 });
  await db.collection("household_invites").createIndex({ expiresAt: 1 });
  await db
    .collection("household_entitlements")
    .createIndex({ ownerClerkId: 1 }, { unique: true });
  indexesEnsured = true;
}
