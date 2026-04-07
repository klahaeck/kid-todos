"use server";

import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/authz";
import type { ActionResult, ChildDTO } from "@/lib/types";
import {
  childToDTO,
  createChild,
  listChildrenForUser,
  reorderChildrenForUser,
  updateChildForUser,
} from "@/lib/data/children";
import { deleteChildCascade } from "@/lib/data/dashboard";
import {
  createChildSchema,
  reorderChildrenSchema,
  updateChildSchema,
} from "@/lib/schemas";

export async function listChildrenAction(): Promise<ActionResult<ChildDTO[]>> {
  try {
    const userId = await requireUserId();
    const rows = await listChildrenForUser(userId);
    return { ok: true, data: rows.map(childToDTO) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function createChildAction(
  raw: unknown,
): Promise<ActionResult<ChildDTO>> {
  try {
    const userId = await requireUserId();
    const parsed = createChildSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    const row = await createChild(userId, parsed.data.name, parsed.data.emoji);
    return { ok: true, data: childToDTO(row) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function updateChildAction(
  raw: unknown,
): Promise<ActionResult<ChildDTO>> {
  try {
    const userId = await requireUserId();
    const parsed = updateChildSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    const { id, ...rest } = parsed.data;
    let childId: ObjectId;
    try {
      childId = new ObjectId(id);
    } catch {
      return { ok: false, error: "Invalid child id" };
    }
    const row = await updateChildForUser(userId, childId, rest);
    if (!row) return { ok: false, error: "Child not found" };
    return { ok: true, data: childToDTO(row) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function deleteChildAction(
  childIdStr: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const userId = await requireUserId();
    let childId: ObjectId;
    try {
      childId = new ObjectId(childIdStr);
    } catch {
      return { ok: false, error: "Invalid child id" };
    }
    const ok = await deleteChildCascade(userId, childId);
    return { ok: true, data: { deleted: ok } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function reorderChildrenAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const userId = await requireUserId();
    const parsed = reorderChildrenSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    await reorderChildrenForUser(userId, parsed.data.orderedIds);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
