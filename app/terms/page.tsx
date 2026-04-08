import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — Starry Steps",
  description: "Terms of Use for the Starry Steps service.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Terms of Use
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: April 8, 2026
      </p>

      <div className="prose-headings:font-bold prose-headings:text-foreground mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-xl">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Starry Steps (&quot;the Service&quot;), you
            agree to be bound by these Terms of Use. If you do not agree to
            these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl">2. Description of Service</h2>
          <p>
            Starry Steps is a family productivity tool that helps parents and
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
        </section>

        <section>
          <h2 className="text-xl">4. Use by Children</h2>
          <p>
            Starry Steps is designed for use by children under parental
            supervision. A parent or legal guardian must create and manage the
            account. Children should only interact with the Service under the
            direction of their parent or guardian. We do not knowingly collect
            personal information directly from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl">5. Acceptable Use</h2>
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
          <h2 className="text-xl">6. Intellectual Property</h2>
          <p>
            All content, design, graphics, and software that make up the
            Service are owned by Starry Steps or its licensors and are
            protected by applicable intellectual property laws. You may not
            copy, modify, distribute, or create derivative works based on the
            Service without prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl">7. User Content</h2>
          <p>
            You retain ownership of any content you create through the
            Service, such as routine names and task descriptions. By using the
            Service, you grant us a limited license to store and display this
            content solely for the purpose of providing the Service to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl">8. Service Availability &amp; Changes</h2>
          <p>
            We strive to keep Starry Steps available and reliable, but we do
            not guarantee uninterrupted access. We may modify, suspend, or
            discontinue any part of the Service at any time with reasonable
            notice when possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Starry Steps and its
            operators shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use
            of the Service. The Service is provided &quot;as is&quot; and
            &quot;as available&quot; without warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-xl">10. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these
            Terms. You may delete your account at any time. Upon termination,
            your right to use the Service ceases and we may delete your data
            in accordance with our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl">11. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material
            changes, we will notify you through the Service or by other
            reasonable means. Your continued use of the Service after changes
            take effect constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl">12. Contact</h2>
          <p>
            If you have questions about these Terms, please reach out to us
            through the contact information provided on the Service.
          </p>
        </section>
      </div>
    </div>
  );
}
