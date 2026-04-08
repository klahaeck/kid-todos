"use server";

import { getSubscriptionAccess } from "@/lib/subscription";

/** For client hooks (e.g. ThemeApplier on /dashboard). */
export async function getSubscriptionFlagsAction() {
  const a = await getSubscriptionAccess();
  return {
    hasAllThemesFeature: a.hasAllThemesFeature,
  };
}
