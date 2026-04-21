"use server";

import { ObjectId } from "mongodb";
import { fetchMutation } from "convex/nextjs";
import { resolveHouseholdContext } from "@/lib/authz";
import type { ActionResult } from "@/lib/types";
import { todayInTimezone } from "@/lib/date";
import { ensureProfileForClerkUser } from "@/lib/data/profile";
import { getChildForUser } from "@/lib/data/children";
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
    const profile = await ensureProfileForClerkUser(dataOwnerId);
    const date = todayInTimezone(profile.timezone);
    const result = await fetchMutation(
      api.completions.toggleForDay,
      {
        ownerUserId: dataOwnerId,
        childId: childIdStr,
        taskId: taskIdStr as Id<"tasks">,
        date,
      },
      { token },
    );
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
    const token = await getConvexAuthToken();
    if (!token || !process.env.NEXT_PUBLIC_CONVEX_URL) {
      return { ok: false, error: "Realtime tasks unavailable (Convex auth)." };
    }
    await fetchMutation(
      api.completions.removeForTask,
      {
        ownerUserId: dataOwnerId,
        taskId: taskIdStr as Id<"tasks">,
      },
      { token },
    );
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
