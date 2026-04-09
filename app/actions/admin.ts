"use server";

import { ObjectId } from "mongodb";
import { requireAdminUser } from "@/lib/authz";
import type { ActionResult, AdminOverviewDTO, ChildDTO, TaskDTO } from "@/lib/types";
import { buildAdminOverview, adminDeleteChild } from "@/lib/data/admin";
import { createChild, childToDTO } from "@/lib/data/children";
import { ensureProfileForClerkUser } from "@/lib/data/profile";
import {
  createTask,
  taskToDTO,
  deleteTaskForUser,
} from "@/lib/data/tasks";
import { getChildForUser } from "@/lib/data/children";
import { createChildSchema, createTaskSchema } from "@/lib/schemas";

export async function getAdminOverviewAction(): Promise<
  ActionResult<AdminOverviewDTO>
> {
  try {
    await requireAdminUser();
    const data = await buildAdminOverview();
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function adminCreateChildAction(
  ownerClerkId: string,
  raw: unknown,
): Promise<ActionResult<ChildDTO>> {
  try {
    await requireAdminUser();
    if (!ownerClerkId?.trim()) {
      return { ok: false, error: "Missing owner id" };
    }
    const parsed = createChildSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    const ownerId = ownerClerkId.trim();
    const profile = await ensureProfileForClerkUser(ownerId);
    const row = await createChild(ownerId, parsed.data.name);
    return { ok: true, data: childToDTO(row, profile.completedTaskIcon) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function adminCreateTaskAction(
  ownerClerkId: string,
  raw: unknown,
): Promise<ActionResult<TaskDTO>> {
  try {
    await requireAdminUser();
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
    const child = await getChildForUser(ownerClerkId.trim(), childId);
    if (!child) return { ok: false, error: "Child not found for user" };
    const row = await createTask(
      ownerClerkId.trim(),
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

export async function adminDeleteChildAction(
  childIdStr: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    await requireAdminUser();
    const ok = await adminDeleteChild(childIdStr);
    return { ok: true, data: { deleted: ok } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function adminDeleteTaskAction(
  ownerClerkId: string,
  taskIdStr: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    await requireAdminUser();
    let taskId: ObjectId;
    try {
      taskId = new ObjectId(taskIdStr);
    } catch {
      return { ok: false, error: "Invalid task id" };
    }
    const ok = await deleteTaskForUser(ownerClerkId.trim(), taskId);
    return { ok: true, data: { deleted: ok } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
