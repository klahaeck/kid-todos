import { HouseholdSettings } from "@/components/household-settings";
import { SettingsForm } from "@/components/settings-form";
import { getSubscriptionAccess } from "@/lib/subscription";

export default async function SettingsPage() {
  const access = await getSubscriptionAccess();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-8">
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
