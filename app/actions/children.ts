"use server";

import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/authz";
import { hasMultipleChildrenFeature } from "@/lib/subscription";
import type { ActionResult, ChildDTO } from "@/lib/types";
import {
  childToDTO,
  createChild,
  getChildForUser,
  listChildrenForUser,
  reorderChildrenForUser,
  updateChildForUser,
} from "@/lib/data/children";
import { ensureProfileForClerkUser } from "@/lib/data/profile";
import { deleteChildCascade } from "@/lib/data/dashboard";
import {
  createChildSchema,
  reorderChildrenSchema,
  updateChildSchema,
} from "@/lib/schemas";
import {
  DEFAULT_CHILD_EVENING_START,
  DEFAULT_CHILD_MORNING_START,
} from "@/lib/routine-filter";
import { timeHmToMinutes } from "@/lib/time-validation";

export async function listChildrenAction(): Promise<ActionResult<ChildDTO[]>> {
  try {
    const userId = await requireUserId();
    const [profile, rows] = await Promise.all([
      ensureProfileForClerkUser(userId),
      listChildrenForUser(userId),
    ]);
    return {
      ok: true,
      data: rows.map((ch) => childToDTO(ch, profile.completedTaskIcon)),
    };
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
    const existingChildren = await listChildrenForUser(userId);
    if (existingChildren.length >= 1) {
      const canHaveMultipleChildren = await hasMultipleChildrenFeature();
      if (!canHaveMultipleChildren) {
        return {
          ok: false,
          error:
            "Upgrade required: your subscription does not include multiple children.",
        };
      }
    }
    const profile = await ensureProfileForClerkUser(userId);
    const row = await createChild(userId, parsed.data.name, parsed.data.emoji);
    return { ok: true, data: childToDTO(row, profile.completedTaskIcon) };
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
    const existing = await getChildForUser(userId, childId);
    if (!existing) return { ok: false, error: "Child not found" };

    const nextMorningStart =
      rest.morningStart === undefined
        ? existing.morningStart ?? DEFAULT_CHILD_MORNING_START
        : (rest.morningStart ?? DEFAULT_CHILD_MORNING_START);
    const nextEveningStart =
      rest.eveningStart === undefined
        ? existing.eveningStart ?? DEFAULT_CHILD_EVENING_START
        : (rest.eveningStart ?? DEFAULT_CHILD_EVENING_START);

    const morningMinutes = timeHmToMinutes(nextMorningStart);
    const eveningMinutes = timeHmToMinutes(nextEveningStart);
    if (
      morningMinutes === null ||
      eveningMinutes === null ||
      morningMinutes >= eveningMinutes
    ) {
      return {
        ok: false,
        error: "Morning start must be earlier than evening start.",
      };
    }
    const row = await updateChildForUser(userId, childId, rest);
    if (!row) return { ok: false, error: "Child not found" };
    const profile = await ensureProfileForClerkUser(userId);
    return { ok: true, data: childToDTO(row, profile.completedTaskIcon) };
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
