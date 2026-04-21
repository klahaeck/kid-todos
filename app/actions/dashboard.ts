"use server";

import { resolveHouseholdContext } from "@/lib/authz";
import { getConvexAuthToken } from "@/lib/convex-clerk-token";
import type { ActionResult, DashboardDTO } from "@/lib/types";
import { buildDashboardForUser } from "@/lib/data/dashboard";

export async function getDashboardData(): Promise<ActionResult<DashboardDTO>> {
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    const convexToken = await getConvexAuthToken();
    const data = await buildDashboardForUser(dataOwnerId, {
      convexToken,
    });
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
