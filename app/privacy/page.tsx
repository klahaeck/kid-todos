import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Starry Steps",
  description: "Privacy Policy for the Starry Steps service.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: April 8, 2026
      </p>

      <div className="prose-headings:font-bold prose-headings:text-foreground mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-xl">1. Introduction</h2>
          <p>
            Starry Steps (&quot;we&quot;, &quot;us&quot;, or &quot;the
            Service&quot;) is committed to protecting the privacy of our users
            and their families. This Privacy Policy explains what information
            we collect, how we use it, and the choices you have.
          </p>
        </section>

        <section>
          <h2 className="text-xl">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Account information:</strong> Your name, email address,
              and authentication credentials when you create an account.
            </li>
            <li>
              <strong>Routine data:</strong> The children&apos;s first names,
              routine names, task descriptions, and completion status that you
              create within the Service.
            </li>
            <li>
              <strong>Preferences:</strong> Settings such as timezone, theme
              choices, and display preferences.
            </li>
            <li>
              <strong>Usage data:</strong> Anonymous analytics about how the
              Service is used, including page views and feature usage, to help
              us improve the experience.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">3. Children&apos;s Privacy</h2>
          <p>
            Starry Steps is designed to be managed by parents and guardians.
            We do not knowingly collect personal information directly from
            children under the age of 13. The only child-related data we store
            is the first name and routine information that a parent or guardian
            enters. We do not require or collect children&apos;s email
            addresses, photos, or other identifying information.
          </p>
          <p className="mt-2">
            If you believe we have inadvertently collected personal information
            from a child, please contact us and we will promptly delete it.
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
            <li>
              Send important service-related communications (e.g., account
              security)
            </li>
            <li>Analyze usage patterns to improve the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">5. Data Sharing &amp; Third Parties</h2>
          <p>
            We do not sell your personal information. We may share limited data
            with trusted third-party services that help us operate the
            Service:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Authentication:</strong> We use Clerk for secure
              sign-in and account management.
            </li>
            <li>
              <strong>Hosting &amp; infrastructure:</strong> The Service is
              hosted on Vercel.
            </li>
            <li>
              <strong>Analytics:</strong> We use privacy-friendly analytics to
              understand Service usage without tracking individual users across
              the web.
            </li>
          </ul>
          <p className="mt-2">
            These providers process data on our behalf and are contractually
            obligated to protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl">6. Data Storage &amp; Security</h2>
          <p>
            Your data is stored securely using industry-standard encryption
            and access controls. We retain your data for as long as your
            account is active or as needed to provide the Service. You may
            request deletion of your data at any time by deleting your
            account.
          </p>
        </section>

        <section>
          <h2 className="text-xl">7. Cookies &amp; Tracking</h2>
          <p>
            We use essential cookies required for authentication and session
            management. We do not use advertising cookies or cross-site
            tracking technologies. Our analytics are privacy-focused and do
            not create individual user profiles.
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
            <li>Withdraw consent for data processing</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, please contact us through the
            information provided below.
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
            If you have questions or concerns about this Privacy Policy or our
            data practices, please reach out to us through the contact
            information provided on the Service.
          </p>
        </section>
      </div>
    </div>
  );
}
