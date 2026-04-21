"use server";

import { ObjectId } from "mongodb";
import { resolveHouseholdContext } from "@/lib/authz";
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
import { getConvexAuthToken } from "@/lib/convex-clerk-token";
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
    const { dataOwnerId } = await resolveHouseholdContext();
    const [profile, rows] = await Promise.all([
      ensureProfileForClerkUser(dataOwnerId),
      listChildrenForUser(dataOwnerId),
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
    const { dataOwnerId } = await resolveHouseholdContext();
    const parsed = createChildSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    const existingChildren = await listChildrenForUser(dataOwnerId);
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
    const profile = await ensureProfileForClerkUser(dataOwnerId);
    const row = await createChild(
      dataOwnerId,
      parsed.data.name,
      parsed.data.emoji,
    );
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
    const { dataOwnerId } = await resolveHouseholdContext();
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
    const existing = await getChildForUser(dataOwnerId, childId);
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
    const row = await updateChildForUser(dataOwnerId, childId, rest);
    if (!row) return { ok: false, error: "Child not found" };
    const profile = await ensureProfileForClerkUser(dataOwnerId);
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
    const { dataOwnerId } = await resolveHouseholdContext();
    let childId: ObjectId;
    try {
      childId = new ObjectId(childIdStr);
    } catch {
      return { ok: false, error: "Invalid child id" };
    }
    const convexToken = await getConvexAuthToken();
    const ok = await deleteChildCascade(dataOwnerId, childId, {
      convexToken,
    });
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
    const { dataOwnerId } = await resolveHouseholdContext();
    const parsed = reorderChildrenSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    await reorderChildrenForUser(dataOwnerId, parsed.data.orderedIds);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
