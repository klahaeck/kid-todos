import { ObjectId } from "mongodb";

/** Normalize stored completion task id (legacy ObjectId or string) for comparisons. */
export function completionTaskIdToString(
  taskId: string | ObjectId | undefined | null,
): string {
  if (taskId == null) return "";
  if (typeof taskId === "string") return taskId;
  return taskId.toHexString();
}

/** Match both legacy BSON ObjectId task ids and Convex string ids in Mongo queries. */
export function taskIdMongoOrClause(taskIdStr: string): (
  | string
  | ObjectId
)[] {
  const out: (string | ObjectId)[] = [taskIdStr];
  if (ObjectId.isValid(taskIdStr) && taskIdStr.length === 24) {
    try {
      out.push(new ObjectId(taskIdStr));
    } catch {
      /* ignore */
    }
  }
  return out;
}
