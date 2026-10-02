import type { ObjectId } from "mongodb";
import { deleteChildForUser, getChildForUser } from "@/lib/data/children";
import { deleteCompletionsForChild } from "@/lib/data/completions";

export async function deleteChildAcrossStores(
  userId: string,
  childId: ObjectId,
  cleanupBatch: () => Promise<{ done: boolean }>,
): Promise<boolean> {
  if (!await getChildForUser(userId, childId)) return false;
  // Keep the Mongo row for retries after network errors or interrupted batches.
  for (let attempt = 0; attempt < 10; attempt++) {
    const { done } = await cleanupBatch();
    if (done) {
      await deleteCompletionsForChild(childId);
      return deleteChildForUser(userId, childId);
    }
  }
  throw new Error("Deletion is still in progress. Try deleting again to finish cleanup.");
}
