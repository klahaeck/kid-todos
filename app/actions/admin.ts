"use server";

import { ObjectId } from "mongodb";
import { fetchMutation } from "convex/nextjs";
import { requireAdminUser } from "@/lib/authz";
import type { ActionResult, AdminOverviewDTO, ChildDTO, TaskDTO } from "@/lib/types";
import { buildAdminOverview, adminDeleteChild } from "@/lib/data/admin";
import { createChild, childToDTO, getChildForUser } from "@/lib/data/children";
import { ensureProfileForClerkUser } from "@/lib/data/profile";
import { createChildSchema, createTaskSchema } from "@/lib/schemas";
import { api } from "@/convex/_generated/api";
import { getConvexServerSecret } from "@/lib/convex-server-secret";
import type { Id } from "@/convex/_generated/dataModel";

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
    const secret = getConvexServerSecret();
    const row = await fetchMutation(api.tasks.adminCreate, {
      secret,
      ownerUserId: ownerClerkId.trim(),
      childId: parsed.data.childId,
      title: parsed.data.title,
      routine: parsed.data.routine,
    });
    return { ok: true, data: row };
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
    const secret = getConvexServerSecret();
    const ok = await fetchMutation(api.tasks.adminDeleteTaskForOwner, {
      secret,
      ownerUserId: ownerClerkId.trim(),
      taskId: taskIdStr as Id<"tasks">,
    });
    return { ok: true, data: { deleted: ok.deleted } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
