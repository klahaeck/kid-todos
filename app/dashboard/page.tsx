import { DashboardView } from "@/components/dashboard-view";
import { resolveHouseholdContext } from "@/lib/authz";
import {
  DEFAULT_DASHBOARD_FONT,
  normalizeDashboardFont,
} from "@/lib/dashboard-font-options";
import { ensureProfileForClerkUser, profileToDTO } from "@/lib/data/profile";
import { getDashboardFontClassName } from "@/lib/dashboard-fonts";
import { getSubscriptionAccess } from "@/lib/subscription";

export default async function DashboardPage() {
  const access = await getSubscriptionAccess();
  let fontId = DEFAULT_DASHBOARD_FONT;
  try {
    const { dataOwnerId } = await resolveHouseholdContext();
    const profile = await ensureProfileForClerkUser(dataOwnerId);
    if (access.hasAllThemesFeature) {
      fontId = normalizeDashboardFont(profileToDTO(profile).dashboardFont);
    }
  } catch {
    fontId = DEFAULT_DASHBOARD_FONT;
  }
  return (
    <DashboardView
      fontClassName={getDashboardFontClassName(fontId)}
      hasMultipleChildrenFeature={access.hasMultipleChildrenFeature}
      hasAllRoutinesFeature={access.hasAllRoutinesFeature}
      showBillingLinks={access.isPrimary}
    />
  );
}
