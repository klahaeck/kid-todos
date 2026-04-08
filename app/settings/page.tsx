import { SettingsForm } from "@/components/settings-form";
import { getSubscriptionAccess } from "@/lib/subscription";

export default async function SettingsPage() {
  const access = await getSubscriptionAccess();
  return (
    <SettingsForm hasAllThemesFeature={access.hasAllThemesFeature} />
  );
}
