import { DashboardView } from "@/components/dashboard-view";
import { requireUserId } from "@/lib/authz";
import {
  DEFAULT_DASHBOARD_FONT,
  normalizeDashboardFont,
} from "@/lib/dashboard-font-options";
import { ensureProfileForClerkUser, profileToDTO } from "@/lib/data/profile";
import { getDashboardFontClassName } from "@/lib/dashboard-fonts";

export default async function DashboardPage() {
  let fontId = DEFAULT_DASHBOARD_FONT;
  try {
    const userId = await requireUserId();
    const profile = await ensureProfileForClerkUser(userId);
    fontId = normalizeDashboardFont(profileToDTO(profile).dashboardFont);
  } catch {
    fontId = DEFAULT_DASHBOARD_FONT;
  }
  return <DashboardView fontClassName={getDashboardFontClassName(fontId)} />;
}
