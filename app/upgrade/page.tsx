import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PricingTable } from "@clerk/nextjs";
import { getSubscriptionAccess } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Upgrade | StarrySteps",
  description: "Choose a plan and subscribe with Clerk Billing",
};

export default async function UpgradePage() {
  const access = await getSubscriptionAccess();
  if (access.isAuthenticated && !access.isPrimary) {
    redirect("/settings");
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 sm:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Choose a plan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find the right fit for your family. Explore plans for multiple
          children, morning routines, and personalized dashboard colors and
          fonts.
        </p>
      </div>
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <PricingTable for="user" newSubscriptionRedirectUrl="/settings?tab=routines" />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/settings"
          className="font-medium underline underline-offset-2"
        >
          Back to settings
        </Link>
      </p>
    </section>
  );
}
