"use server";

import { requireUserId } from "@/lib/authz";
import type { ActionResult, ProfileDTO } from "@/lib/types";
import {
  ensureProfileForClerkUser,
  profileToDTO,
  updateProfileForUser,
} from "@/lib/data/profile";
import { updateProfileSchema } from "@/lib/schemas";

export async function getProfile(): Promise<ActionResult<ProfileDTO>> {
  try {
    const userId = await requireUserId();
    const p = await ensureProfileForClerkUser(userId);
    return { ok: true, data: profileToDTO(p) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function updateProfile(
  raw: unknown,
): Promise<ActionResult<ProfileDTO>> {
  try {
    const userId = await requireUserId();
    const parsed = updateProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    const p = await updateProfileForUser(userId, parsed.data);
    return { ok: true, data: profileToDTO(p) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
