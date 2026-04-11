import { HouseholdSettings } from "@/components/household-settings";
import { SettingsForm } from "@/components/settings-form";
import { getSubscriptionAccess } from "@/lib/subscription";

export default async function SettingsPage() {
  const access = await getSubscriptionAccess();
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-10 py-6">
      <SettingsForm
        hasAllThemesFeature={access.hasAllThemesFeature}
        showBillingLinks={access.isPrimary}
      />
      <HouseholdSettings
        hasMultipleUsersFeature={access.hasMultipleUsersFeature}
        isPrimary={access.isPrimary}
      />
    </div>
  );
}
