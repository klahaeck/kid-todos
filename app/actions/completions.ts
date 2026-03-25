"use server";

import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/authz";
import type { ActionResult } from "@/lib/types";
import { todayInTimezone } from "@/lib/date";
import { ensureProfileForClerkUser } from "@/lib/data/profile";
import { getChildForUser } from "@/lib/data/children";
import { getTaskForUser } from "@/lib/data/tasks";
import { toggleCompletion } from "@/lib/data/completions";

export type ToggleCompletionResult = { completed: boolean };

export async function toggleTaskCompletionAction(
  childIdStr: string,
  taskIdStr: string,
): Promise<ActionResult<ToggleCompletionResult>> {
  try {
    const userId = await requireUserId();
    let childId: ObjectId;
    let taskId: ObjectId;
    try {
      childId = new ObjectId(childIdStr);
      taskId = new ObjectId(taskIdStr);
    } catch {
      return { ok: false, error: "Invalid id" };
    }
    const child = await getChildForUser(userId, childId);
    if (!child) return { ok: false, error: "Child not found" };
    const task = await getTaskForUser(userId, taskId);
    if (!task || !task.childId.equals(childId)) {
      return { ok: false, error: "Task not found" };
    }
    const profile = await ensureProfileForClerkUser(userId);
    const date = todayInTimezone(profile.timezone);
    const result = await toggleCompletion(userId, childId, taskId, date);
    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
