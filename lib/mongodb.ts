import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/** Avoids TLS handshake failures (OpenSSL alert 80) when Node picks IPv6 first on hosts like Vercel. */
const clientOptions: MongoClientOptions = {
  autoSelectFamily: false,
};

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  return uri;
}

let prodClientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  const uri = getMongoUri();
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, clientOptions);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }
  if (!prodClientPromise) {
    prodClientPromise = new MongoClient(uri, clientOptions).connect();
  }
  return prodClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const name = process.env.MONGODB_DB_NAME ?? "kid-todos";
  return client.db(name);
}

let indexesEnsured = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const db = await getDb();
  await db.collection("profiles").createIndex({ clerkId: 1 }, { unique: true });
  await db.collection("children").createIndex({ userId: 1, sortOrder: 1 });
  await db.collection("tasks").createIndex({ childId: 1, sortOrder: 1 });
  await db.collection("tasks").createIndex({ userId: 1 });
  await db.collection("completions").createIndex({ childId: 1, date: 1 });
  await db
    .collection("completions")
    .createIndex({ taskId: 1, date: 1 }, { unique: true });
  indexesEnsured = true;
}
