import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — StarrySteps",
  description: "Terms of Use for the StarrySteps service.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Terms of Use
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: October 2, 2026
      </p>

      <div className="prose-headings:font-bold prose-headings:text-foreground mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-xl">1. Acceptance of Terms</h2>
          <p>
            By accessing or using StarrySteps (&quot;the Service&quot;), operated
            by Starry Steps (&quot;we&quot; or &quot;us&quot;), you agree to be bound
            by these Terms of Use. Our{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>{" "}
            explains how we handle information. If you do not agree to these
            terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl">2. Description of Service</h2>
          <p>
            StarrySteps is a family productivity tool that helps parents and
            caregivers create daily routine checklists for children. The Service
            allows you to manage routines, track task completion, and support
            children in building independent habits.
          </p>
        </section>

        <section>
          <h2 className="text-xl">3. Accounts &amp; Registration</h2>
          <p>
            You must create an account to use the Service. You are responsible
            for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account. You must be at
            least 18 years old, or the age of majority in your jurisdiction, to
            create an account.
          </p>
          <p className="mt-2">
            We use Clerk to provide sign-in and account management. Where
            available, you may sign in through a third-party identity provider
            using single sign-on (SSO). You are responsible for securing that
            provider account as well as your StarrySteps account. The identity
            provider&apos;s terms apply to your use of its services. We do not
            receive your identity provider&apos;s password, and access to
            StarrySteps may be affected if that provider account becomes
            unavailable.
          </p>
        </section>

        <section>
          <h2 className="text-xl">4. Use by Children</h2>
          <p>
            StarrySteps is designed for use by children under parental
            supervision. A parent or legal guardian must create and manage the
            account. Children should only interact with the Service under the
            direction of their parent or guardian. Sign-in accounts and
            subscriptions are for adults; a child profile is part of the
            adult-managed account and does not have separate sign-in credentials.
            Routine interactions, including a child marking a task complete, are
            recorded as described in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl">5. Subscriptions &amp; Payments</h2>
          <p>
            Some features require a paid subscription. The available features,
            price, currency, billing interval, and any trial or promotional
            conditions are shown when you choose a plan and before you confirm
            your purchase. By subscribing, you authorize recurring charges to
            your selected payment method at the disclosed interval until you
            cancel. Subscriptions renew automatically unless canceled before the
            next renewal.
          </p>
          <p className="mt-2">
            We use Clerk Billing to manage subscriptions and Stripe to process
            payments. Your subscription is for the StarrySteps Service, and
            Starry Steps is responsible for its pricing and billing policies.
            Clerk and Stripe provide billing and payment services; they do not
            provide the StarrySteps Service. You must provide accurate billing
            information and be authorized to use your payment method. Failed or
            overdue payments may result in loss of paid features.
          </p>
          <p className="mt-2">
            To manage your payment method or cancel, open your account menu,
            choose Manage account, and use the billing section. If you cannot
            access those controls, contact support@starrysteps.com. Cancellation
            stops future renewals, and paid access normally continues until the
            end of the current billing period; review the effective date shown
            when you cancel. Signing out, disconnecting an SSO provider, or
            stopping use of the Service does not cancel your subscription.
          </p>
          <p className="mt-2">
            Cancellation does not itself issue a refund. For a billing error or
            refund request, contact support@starrysteps.com so we can review it.
            Nothing in these Terms limits any refund, withdrawal, or other
            consumer rights you have under applicable law. If you change plans,
            review the effective date and any charges or credits shown before
            confirming the change.
          </p>
        </section>

        <section>
          <h2 className="text-xl">6. Household Sharing</h2>
          <p>
            Where your plan permits household sharing, invited adults use their
            own sign-in accounts to access and edit the shared family dashboard,
            child profiles, routines, and preferences. Only invite people you
            trust and are authorized to share this information with. The primary
            account manages the household subscription and is responsible for
            its charges. Leaving a household or removing a member does not
            cancel the primary account&apos;s subscription. Access to shared
            features depends on the primary account&apos;s plan.
          </p>
        </section>

        <section>
          <h2 className="text-xl">7. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Use the Service for any unlawful purpose or in violation of any
              applicable laws
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service
            </li>
            <li>
              Upload or transmit any harmful, offensive, or malicious content
            </li>
            <li>
              Use automated tools to scrape, crawl, or extract data from the
              Service
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">8. Intellectual Property</h2>
          <p>
            All content, design, graphics, and software that make up the
            Service are owned by Starry Steps or its licensors and are
            protected by applicable intellectual property laws. You may not
            copy, modify, distribute, or create derivative works based on the
            Service without prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl">9. User Content</h2>
          <p>
            You retain ownership of any content you create through the
            Service, such as routine names and task descriptions. By using the
            Service, you grant us a limited license to store and display this
            content solely for the purpose of providing the Service to you,
            including household members you authorize to access it.
          </p>
        </section>

        <section>
          <h2 className="text-xl">10. Service Availability &amp; Changes</h2>
          <p>
            We strive to keep StarrySteps available and reliable, but we do
            not guarantee uninterrupted access. We may modify, suspend, or
            discontinue any part of the Service at any time with reasonable
            notice when possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl">11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Starry Steps and its
            operators shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use
            of the Service. The Service is provided &quot;as is&quot; and
            &quot;as available&quot; without warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-xl">12. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these
            Terms. You may stop using the Service and request account closure
            at any time. Before closing your account, review and cancel any
            subscription through the billing controls described above. Deleting
            your Clerk sign-in account does not automatically delete family
            data stored in our other databases; contact support@starrysteps.com
            to request deletion across the Service. Upon termination, your
            right to use the Service ceases, and data is handled in accordance
            with our Privacy Policy. Any mandatory consumer rights continue to
            apply.
          </p>
        </section>

        <section>
          <h2 className="text-xl">13. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material
            changes, we will notify you through the Service or by other
            reasonable means. Your continued use of the Service after changes
            take effect constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl">14. Contact</h2>
          <p>
            StarrySteps is operated by Starry Steps. For questions about these
            Terms, subscriptions, or billing, email{" "}
            <a
              href="mailto:support@starrysteps.com"
              className="underline underline-offset-4"
            >
              support@starrysteps.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
