"use server";

import { requireUserId } from "@/lib/authz";
import type { ActionResult, DashboardDTO } from "@/lib/types";
import { buildDashboardForUser } from "@/lib/data/dashboard";

export async function getDashboardData(): Promise<ActionResult<DashboardDTO>> {
  try {
    const userId = await requireUserId();
    const data = await buildDashboardForUser(userId);
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
