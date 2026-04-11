"use server";

import { resolveHouseholdContext } from "@/lib/authz";
import type { ActionResult, DashboardDTO } from "@/lib/types";
import { buildDashboardForUser } from "@/lib/data/dashboard";

export async function getDashboardData(): Promise<ActionResult<DashboardDTO>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    const data = await buildDashboardForUser(dataOwnerId);
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
