import type { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Upgrade | StarrySteps",
  description: "Choose a plan and subscribe with Clerk Billing",
};

export default function UpgradePage() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Choose a plan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscribe through Clerk to unlock features like multiple children, the{" "}
          <span className="font-medium text-foreground">all_routines</span>{" "}
          feature for morning tasks, and{" "}
          <span className="font-medium text-foreground">all_themes</span> for
          custom dashboard colors and fonts.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <PricingTable
          for="user"
          newSubscriptionRedirectUrl="/routines"
        />
      </div>
    </section>
  );
}
