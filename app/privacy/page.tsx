import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — StarrySteps",
  description: "Privacy Policy for the StarrySteps service.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: October 2, 2026
      </p>

      <div className="prose-headings:font-bold prose-headings:text-foreground mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-xl">1. Introduction</h2>
          <p>
            StarrySteps (&quot;the Service&quot;) is operated by Starry Steps
            (&quot;we&quot; or &quot;us&quot;). This Privacy Policy explains what
            information we and our service providers collect, how we use and
            share it, and the choices available to you and your family.
          </p>
        </section>

        <section>
          <h2 className="text-xl">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Account and sign-in information:</strong> Your account
              identifier, name, email address, and profile image where provided.
              Clerk manages authentication, linked accounts, and sessions. If
              you choose single sign-on (SSO), Clerk receives information from
              your chosen identity provider, such as your provider identifier,
              name, email address, and profile image, according to the permissions
              you approve. Authentication credentials are handled by Clerk or
              your identity provider; we do not receive your identity
              provider&apos;s password.
            </li>
            <li>
              <strong>Family and routine data:</strong> Children&apos;s names or
              nicknames, chosen icons, routine schedules, task descriptions, and
              completion records, including dates and times. This includes
              changes and task completions made on your family dashboard by you,
              authorized household members, or a child under your supervision.
            </li>
            <li>
              <strong>Household information:</strong> Invitees&apos; email
              addresses, invitations and their status, membership records, and
              account identifiers used to share access to family routines.
            </li>
            <li>
              <strong>Preferences:</strong> Settings such as timezone, theme
              choices, and display preferences.
            </li>
            <li>
              <strong>Billing information:</strong> Clerk Billing and Stripe
              process payment and billing details, such as billing contact
              information, payment method details, and transaction records. We
              receive subscription, plan, and feature-access information and may
              access payment status, payment history, and limited payment method
              details through these providers. Our application databases do not
              store full payment card numbers or card security codes.
            </li>
            <li>
              <strong>Device and usage information:</strong> We and our providers
              may process IP addresses, browser and device information, pages
              visited, referring pages, approximate location, timestamps,
              security logs, errors, and performance measurements to operate,
              protect, and improve the Service.
            </li>
            <li>
              <strong>Support information:</strong> Messages and information you
              provide when contacting us about your account, billing, or privacy.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">3. Children&apos;s Privacy</h2>
          <p>
            Sign-in accounts, household invitations, and subscriptions are for
            adults. Parents or guardians create and manage child profiles;
            children do not need a separate Clerk or SSO account to use their
            family dashboard under supervision. You may use a nickname instead
            of a child&apos;s full name. Child profiles do not require an email
            address, photo, date of birth, or payment information. Please avoid
            including sensitive information in names or task descriptions.
          </p>
          <p className="mt-2">
            We store the child profile, routines, and completion history
            associated with the adult-managed account, including when a child
            marks a task complete. Device, session, and usage information
            described in this Policy may also be processed when that dashboard
            is used. Parents or guardians can review and edit this information,
            remove child profiles in the Service, or contact
            support@starrysteps.com to request access or deletion. If you believe
            a child has created a sign-in account or provided information without
            appropriate parental involvement, contact us so we can investigate
            and address it.
          </p>
        </section>

        <section>
          <h2 className="text-xl">4. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>
              Display your routines and track task completion for your family
            </li>
            <li>Personalize your experience (themes, fonts, timezone)</li>
            <li>Authenticate users and protect accounts against misuse</li>
            <li>Manage household invitations and shared access</li>
            <li>Process payments and manage subscriptions and paid features</li>
            <li>
              Send important service-related communications (e.g., account
              security, household invitations, and billing) and respond to
              support requests
            </li>
            <li>Analyze usage patterns to improve the Service</li>
            <li>Meet legal obligations and resolve billing or other disputes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">5. Data Sharing &amp; Third Parties</h2>
          <p>
            We do not sell your personal information. We share information as
            needed to provide the Service with the following providers and
            recipients:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Authentication and subscriptions:</strong> Clerk processes
              account, SSO, session, and subscription information to provide
              sign-in, account management, and Clerk Billing. See{" "}
              <a
                href="https://clerk.com/legal/privacy"
                className="underline underline-offset-4"
              >
                Clerk&apos;s Privacy Policy
              </a>
              . Your chosen SSO provider also processes information when you use
              its sign-in service, under its own privacy policy.
            </li>
            <li>
              <strong>Payment processing:</strong> Stripe processes payment and
              billing information for subscriptions, including payment method
              details and transaction records. See{" "}
              <a
                href="https://stripe.com/privacy"
                className="underline underline-offset-4"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Data storage and synchronization:</strong> We use MongoDB
              and Convex to store family profiles, routines, completion history,
              preferences, and household access records, and to synchronize
              changes between devices.
            </li>
            <li>
              <strong>Hosting &amp; infrastructure:</strong> The Service is
              hosted on Vercel, which processes requests and technical
              information to deliver and secure the application.
            </li>
            <li>
              <strong>Analytics and performance:</strong> We use Vercel Web
              Analytics and Speed Insights for usage and performance
              measurements. We also use Google Tag Manager to load and manage
              website tags, which may process device and usage information and
              use cookies depending on their configuration. See the Cookies
              &amp; Analytics section below.
            </li>
            <li>
              <strong>Email delivery:</strong> Our email delivery provider
              processes recipients&apos; email addresses and message content to
              deliver household invitations and other service messages.
            </li>
            <li>
              <strong>Household members:</strong> Adults who join your household
              can view and edit the shared child profiles, routines, completion
              information, and preferences. The household owner can manage
              members and invitations. Only invite people you trust with this
              information.
            </li>
          </ul>
          <p className="mt-2">
            Providers may process information on our behalf and, for activities
            such as operating their own identity services, fraud prevention, or
            meeting legal obligations, under their own privacy policies. We may
            also disclose information when required by law or necessary to
            protect the Service or the rights and safety of our users.
          </p>
        </section>

        <section>
          <h2 className="text-xl">6. Data Storage &amp; Security</h2>
          <p>
            We use access controls and our providers&apos; security measures to
            protect information. No system can guarantee complete security.
            Information may be processed in the United States or other countries
            where our providers operate, whose data protection laws may differ
            from those where you live.
          </p>
          <p className="mt-2">
            We retain information as needed to provide the Service and meet
            legal, accounting, security, or dispute-resolution obligations.
            Subscription cancellation does not delete your account or family
            data. Deleting your Clerk sign-in account does not automatically
            remove routine or household records from our other databases. To
            request deletion across the Service, contact
            support@starrysteps.com. Backup copies and records needed for legal
            or financial obligations may be retained separately. Clerk, Stripe,
            and your SSO provider may also retain information as described in
            their own policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl">7. Cookies &amp; Analytics</h2>
          <p>
            Clerk uses cookies and similar technologies for sign-in, sessions,
            and account security. SSO providers and payment services may also
            use cookies or similar technologies when you interact with their
            services. Browser storage may be used to remember preferences.
          </p>
          <p className="mt-2">
            Vercel Web Analytics uses a temporary identifier derived from request
            information rather than analytics cookies, and Speed Insights
            collects performance measurements without identifying individual
            visitors. These features are described in{" "}
            <a
              href="https://vercel.com/docs/analytics/privacy-policy"
              className="underline underline-offset-4"
            >
              Vercel&apos;s Web Analytics privacy documentation
            </a>{" "}
            and its{" "}
            <a
              href="https://vercel.com/docs/speed-insights/privacy-policy"
              className="underline underline-offset-4"
            >
              Speed Insights privacy documentation
            </a>
            . Other providers&apos; cookies and data practices are described
            separately in this Policy.
          </p>
          <p className="mt-2">
            Google Tag Manager is also included in the Service. The cookies and
            information used by tags loaded through it depend on the configured
            tags. See{" "}
            <a
              href="https://policies.google.com/privacy"
              className="underline underline-offset-4"
            >
              Google&apos;s Privacy Policy
            </a>{" "}
            for Google&apos;s practices. You can restrict or clear cookies and
            site storage using your browser settings, although blocking
            essential cookies can prevent sign-in or payment features from
            working.
          </p>
        </section>

        <section>
          <h2 className="text-xl">8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to or request restriction of certain processing</li>
            <li>Withdraw consent where processing relies on consent</li>
            <li>Complain to your local data protection authority</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, including requests about a child profile
            you manage, email support@starrysteps.com. We may need to verify your
            identity and authority to act for the account or child before
            fulfilling a request. You can manage your sign-in details and linked
            SSO accounts through Manage account in your account menu. Removing
            an SSO connection does not by itself delete Service data or cancel
            a subscription.
          </p>
        </section>

        <section>
          <h2 className="text-xl">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make
            material changes, we will notify you through the Service or by
            other means. The &quot;Last updated&quot; date at the top of this
            page reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-xl">10. Contact Us</h2>
          <p>
            StarrySteps is operated by Starry Steps. For privacy questions,
            concerns, or requests about your or your child&apos;s information,
            email{" "}
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
