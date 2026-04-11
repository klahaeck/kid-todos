"use server";

import { ObjectId } from "mongodb";
import { resolveHouseholdContext } from "@/lib/authz";
import type { ActionResult, Routine, TaskDTO } from "@/lib/types";
import {
  createTask,
  deleteTaskForUser,
  reorderTasksForUser,
  taskToDTO,
  updateTaskForUser,
} from "@/lib/data/tasks";
import { getChildForUser } from "@/lib/data/children";
import {
  createTaskSchema,
  reorderTasksSchema,
  updateTaskSchema,
} from "@/lib/schemas";

export async function createTaskAction(
  raw: unknown,
): Promise<ActionResult<TaskDTO>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    const parsed = createTaskSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    let childId: ObjectId;
    try {
      childId = new ObjectId(parsed.data.childId);
    } catch {
      return { ok: false, error: "Invalid child id" };
    }
    const child = await getChildForUser(dataOwnerId, childId);
    if (!child) return { ok: false, error: "Child not found" };
    const row = await createTask(
      dataOwnerId,
      childId,
      parsed.data.title,
      parsed.data.routine,
    );
    return { ok: true, data: taskToDTO(row) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function updateTaskAction(
  raw: unknown,
): Promise<ActionResult<TaskDTO>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    const parsed = updateTaskSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    let taskId: ObjectId;
    try {
      taskId = new ObjectId(parsed.data.id);
    } catch {
      return { ok: false, error: "Invalid task id" };
    }
    const d = parsed.data;
    const patch: Partial<{
      title: string;
      routine: Routine;
      active: boolean;
    }> = {};
    if (d.title !== undefined) patch.title = d.title;
    if (d.routine !== undefined) patch.routine = d.routine;
    if (d.active !== undefined) patch.active = d.active;
    const row = await updateTaskForUser(dataOwnerId, taskId, patch);
    if (!row) return { ok: false, error: "Task not found" };
    return { ok: true, data: taskToDTO(row) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function deleteTaskAction(
  taskIdStr: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    let taskId: ObjectId;
    try {
      taskId = new ObjectId(taskIdStr);
    } catch {
      return { ok: false, error: "Invalid task id" };
    }
    const ok = await deleteTaskForUser(dataOwnerId, taskId);
    return { ok: true, data: { deleted: ok } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function reorderTasksAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    const parsed = reorderTasksSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    let childId: ObjectId;
    try {
      childId = new ObjectId(parsed.data.childId);
    } catch {
      return { ok: false, error: "Invalid child id" };
    }
    const child = await getChildForUser(dataOwnerId, childId);
    if (!child) return { ok: false, error: "Child not found" };
    await reorderTasksForUser(dataOwnerId, childId, parsed.data.orderedIds);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
