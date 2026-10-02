import { Suspense } from "react";
import { HouseholdSettings } from "@/components/household-settings";
import { RoutineConfigView } from "@/components/routine-config-view";
import { SettingsForm } from "@/components/settings-form";
import { SettingsTabs } from "@/components/settings-tabs";
import { getSubscriptionAccess } from "@/lib/subscription";

export default async function SettingsPage() {
  const access = await getSubscriptionAccess();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 sm:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your family&apos;s preferences and daily routines.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading settings…</p>}>
        <SettingsTabs
          settings={
            <>
              <SettingsForm
                hasAllThemesFeature={access.hasAllThemesFeature}
                showBillingLinks={access.isPrimary}
              />
              <HouseholdSettings
                hasMultipleUsersFeature={access.hasMultipleUsersFeature}
                isPrimary={access.isPrimary}
              />
            </>
          }
          routines={
            <RoutineConfigView
              hasMultipleChildrenFeature={access.hasMultipleChildrenFeature}
              hasAllRoutinesFeature={access.hasAllRoutinesFeature}
              showBillingLinks={access.isPrimary}
            />
          }
        />
      </Suspense>
    </div>
  );
}
