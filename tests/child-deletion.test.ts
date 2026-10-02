import { ObjectId } from "mongodb";
import { beforeEach, expect, test, vi } from "vitest";
import { deleteChildAcrossStores } from "@/lib/data/child-deletion";
import { getChildForUser, deleteChildForUser } from "@/lib/data/children";
import { deleteCompletionsForChild } from "@/lib/data/completions";

vi.mock("@/lib/data/children", () => ({ getChildForUser: vi.fn(), deleteChildForUser: vi.fn() }));
vi.mock("@/lib/data/completions", () => ({ deleteCompletionsForChild: vi.fn() }));
const id = new ObjectId();
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getChildForUser).mockResolvedValue({ _id: id } as Awaited<ReturnType<typeof getChildForUser>>);
  vi.mocked(deleteChildForUser).mockResolvedValue(true);
});
test("failed Convex cleanup retains the Mongo child and history for retry", async () => {
  const cleanup = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ done: true });
  await expect(deleteChildAcrossStores("owner", id, cleanup)).rejects.toThrow("offline");
  expect(deleteChildForUser).not.toHaveBeenCalled();
  expect(deleteCompletionsForChild).not.toHaveBeenCalled();
  await expect(deleteChildAcrossStores("owner", id, cleanup)).resolves.toBe(true);
  expect(deleteCompletionsForChild).toHaveBeenCalledWith(id);
  expect(deleteChildForUser).toHaveBeenCalledWith("owner", id);
});
test("all batches finish before Mongo cleanup; interrupted long cleanups can retry", async () => {
  const cleanup = vi.fn().mockResolvedValue({ done: false });
  await expect(deleteChildAcrossStores("owner", id, cleanup)).rejects.toThrow("still in progress");
  expect(cleanup).toHaveBeenCalledTimes(10);
  expect(deleteChildForUser).not.toHaveBeenCalled();
  cleanup.mockResolvedValueOnce({ done: false }).mockResolvedValueOnce({ done: true });
  await expect(deleteChildAcrossStores("owner", id, cleanup)).resolves.toBe(true);
  expect(deleteCompletionsForChild).toHaveBeenCalledTimes(1);
});
test("Mongo history errors also leave the child retryable", async () => {
  vi.mocked(deleteCompletionsForChild).mockRejectedValueOnce(new Error("history unavailable"));
  await expect(deleteChildAcrossStores("owner", id, async () => ({ done: true }))).rejects.toThrow("history unavailable");
  expect(deleteChildForUser).not.toHaveBeenCalled();
});
