"use server";

import { ObjectId } from "mongodb";
import { fetchQuery } from "convex/nextjs";
import { resolveHouseholdContext } from "@/lib/authz";
import type { ActionResult } from "@/lib/types";
import { todayInTimezone } from "@/lib/date";
import { ensureProfileForClerkUser } from "@/lib/data/profile";
import { getChildForUser } from "@/lib/data/children";
import { toggleCompletion, deleteCompletionsForTask } from "@/lib/data/completions";
import { getConvexAuthToken } from "@/lib/convex-clerk-token";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type ToggleCompletionResult = { completed: boolean };

export async function toggleTaskCompletionAction(
  childIdStr: string,
  taskIdStr: string,
): Promise<ActionResult<ToggleCompletionResult>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    let childId: ObjectId;
    try {
      childId = new ObjectId(childIdStr);
    } catch {
      return { ok: false, error: "Invalid id" };
    }
    const child = await getChildForUser(dataOwnerId, childId);
    if (!child) return { ok: false, error: "Child not found" };
    const token = await getConvexAuthToken();
    if (!token || !process.env.NEXT_PUBLIC_CONVEX_URL) {
      return { ok: false, error: "Realtime tasks unavailable (Convex auth)." };
    }
    const task = await fetchQuery(
      api.tasks.getForOwner,
      {
        ownerUserId: dataOwnerId,
        taskId: taskIdStr as Id<"tasks">,
      },
      { token },
    );
    if (!task || task.childId !== childIdStr) {
      return { ok: false, error: "Task not found" };
    }
    const profile = await ensureProfileForClerkUser(dataOwnerId);
    const date = todayInTimezone(profile.timezone);
    const result = await toggleCompletion(dataOwnerId, childId, taskIdStr, date, {
      title: task.title,
      routine: task.routine,
    });
    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

/** After a task is removed from Convex, clear Mongo completion rows for that task id. */
export async function purgeTaskCompletionsAction(
  taskIdStr: string,
  childIdStr: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    let childId: ObjectId;
    try {
      childId = new ObjectId(childIdStr);
    } catch {
      return { ok: false, error: "Invalid child id" };
    }
    const child = await getChildForUser(dataOwnerId, childId);
    if (!child) return { ok: false, error: "Child not found" };
    await deleteCompletionsForTask(taskIdStr);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
