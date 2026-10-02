import { MongoClient } from "mongodb";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mongo = vi.hoisted(() => ({ connect: vi.fn() }));

vi.mock("mongodb", () => ({
  ServerApiVersion: { v1: "1" },
  MongoClient: vi.fn(class {
    connect = mongo.connect;
  }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mongo.connect.mockReset();
  delete global._mongoClientPromise;
  vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017/kid-todos");
});

afterEach(() => {
  delete global._mongoClientPromise;
  vi.unstubAllEnvs();
});

test.each(["development", "production"])(
  "%s shares a pending connection and reuses the connected client",
  async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    const client = {} as MongoClient;
    let resolveConnection!: (value: MongoClient) => void;
    mongo.connect.mockReturnValue(new Promise<MongoClient>((resolve) => {
      resolveConnection = resolve;
    }));
    const { getMongoClient } = await import("@/lib/mongodb");

    const first = getMongoClient();
    const second = getMongoClient();
    expect(second).toBe(first);
    expect(MongoClient).toHaveBeenCalledTimes(1);

    resolveConnection(client);
    await expect(first).resolves.toBe(client);
    await expect(getMongoClient()).resolves.toBe(client);
    expect(mongo.connect).toHaveBeenCalledTimes(1);
  },
);

test.each(["development", "production"])(
  "%s retries after a failed connection without restarting the process",
  async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    const failure = new Error("TLS handshake failed");
    const client = {} as MongoClient;
    mongo.connect.mockRejectedValueOnce(failure).mockResolvedValueOnce(client);
    const { getMongoClient } = await import("@/lib/mongodb");

    const first = getMongoClient();
    const concurrent = getMongoClient();
    await expect(first).rejects.toBe(failure);
    await expect(concurrent).rejects.toBe(failure);

    await expect(getMongoClient()).resolves.toBe(client);
    expect(MongoClient).toHaveBeenCalledTimes(2);
    expect(mongo.connect).toHaveBeenCalledTimes(2);
  },
);

test("development reuses the connection across module reloads", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const client = {} as MongoClient;
  mongo.connect.mockResolvedValue(client);
  const firstModule = await import("@/lib/mongodb");
  await expect(firstModule.getMongoClient()).resolves.toBe(client);

  vi.resetModules();
  const reloadedModule = await import("@/lib/mongodb");
  await expect(reloadedModule.getMongoClient()).resolves.toBe(client);
  expect(MongoClient).toHaveBeenCalledTimes(1);
});
