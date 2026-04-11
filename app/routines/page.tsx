import { RoutineConfigView } from "@/components/routine-config-view";
import { getSubscriptionAccess } from "@/lib/subscription";

export default async function RoutinesPage() {
  const access = await getSubscriptionAccess();
  return (
    <RoutineConfigView
      hasMultipleChildrenFeature={access.hasMultipleChildrenFeature}
      hasAllRoutinesFeature={access.hasAllRoutinesFeature}
      showBillingLinks={access.isPrimary}
    />
  );
}
