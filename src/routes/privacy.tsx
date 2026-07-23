import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Karawhiua" },
      {
        name: "description",
        content:
          "Privacy Policy for Karawhiua, the virtual sports day platform from Sport Waikato. Learn how we collect, use, and protect your data.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-grey">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-brand-dark/60 hover:text-brand-dark"
          >
            <img src="/KarawhiuaWordmark.png" alt="Karawhiua" className="h-5 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 font-accent text-3xl font-bold text-brand-dark">Privacy Policy</h1>
        <p className="mb-10 text-sm text-gray-500">Effective: 1 July 2025</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-brand-dark">1. Who we are</h2>
            <p>
              Karawhiua (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a virtual sports day
              platform operated by Sport Waikato, a regional sports trust based in Hamilton, New
              Zealand. Our platform helps school students log physical activity, earn points for
              their house, and participate in movement challenges.
            </p>
            <p>
              For privacy questions, contact Sport Waikato at{" "}
              <a href="mailto:hello@sportwaikato.org.nz" className="text-[#1B5E4B] underline">
                hello@sportwaikato.org.nz
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">2. Information we collect</h2>
            <p>We collect only the information we need to run the programme:</p>
            <ul className="list-disc pl-6">
              <li>
                <strong>Account information</strong> — your name and email address, provided when
                you sign up or when your school creates an account on your behalf.
              </li>
              <li>
                <strong>School and house affiliation</strong> — the school you belong to and your
                house within that school.
              </li>
              <li>
                <strong>Activity data</strong> — the type, duration, distance, and date of physical
                activities you log, plus optional self-reported feeling ratings.
              </li>
              <li>
                <strong>Authentication data</strong> — when you sign in with Google, Google shares
                your name and email address with us. We do not access your Google Drive, contacts,
                or any other Google service data.
              </li>
              <li>
                <strong>Usage data</strong> — anonymised page views and feature usage via PostHog
                product analytics, so we can understand how the platform is used and improve it.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">3. Children&apos;s privacy</h2>
            <p>
              Karawhiua is designed for school students. Accounts are created and managed by
              schools, and teachers and school administrators can view student activity data within
              their own school. We collect the minimum personal information necessary to operate the
              programme. We never market to children or serve targeted advertising.
            </p>
            <p>
              If you are a parent or guardian and have concerns about your child&apos;s data, please
              contact your school or{" "}
              <a href="mailto:hello@sportwaikato.org.nz" className="text-[#1B5E4B] underline">
                hello@sportwaikato.org.nz
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">
              4. How we use your information
            </h2>
            <ul className="list-disc pl-6">
              <li>To display your activity log, points, leaderboard rank, and achievements.</li>
              <li>To show your school and house on leaderboards and within school dashboards.</li>
              <li>
                To allow school administrators to view anonymised and aggregated activity reports.
              </li>
              <li>
                To send programme-related emails (e.g., weekly round-ups, challenge reminders).
              </li>
              <li>To improve the platform with anonymised analytics.</li>
            </ul>
            <p className="text-sm italic text-gray-500">
              Movement data is used only to run the programme and is never sold.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">5. Data sharing</h2>
            <p>We do not sell, rent, or trade your personal information. We share data only:</p>
            <ul className="list-disc pl-6">
              <li>
                <strong>With your school</strong> — school administrators can see student activity,
                points, and leaderboard data for their own school.
              </li>
              <li>
                <strong>With service providers</strong> — we use trusted third-party services to
                operate the platform:
                <ul className="list-circle pl-6">
                  <li>
                    <strong>Supabase</strong> (hosting and database, based in the US) stores account
                    and activity data.
                  </li>
                  <li>
                    <strong>Resend</strong> (email delivery) processes email sending on our behalf.
                  </li>
                  <li>
                    <strong>PostHog</strong> (product analytics, EU-hosted) receives anonymised
                    usage events.
                  </li>
                  <li>
                    <strong>Sentry</strong> (error monitoring) receives crash reports.
                  </li>
                </ul>
              </li>
              <li>
                <strong>When required by law</strong> — if we receive a valid legal request from New
                Zealand authorities.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">6. Data storage and security</h2>
            <p>
              Your data is stored on Supabase servers in the United States. We use industry-standard
              encryption in transit (TLS) and at rest. Access to personal data is strictly limited
              to Sport Waikato staff who need it to operate and support the programme. We apply
              Row-Level Security on our database so users can only see data they are authorised to
              view.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">7. Your rights</h2>
            <p>Under the New Zealand Privacy Act 2020, you have the right to:</p>
            <ul className="list-disc pl-6">
              <li>Ask for a copy of the personal information we hold about you.</li>
              <li>Ask us to correct your information if it is wrong.</li>
              <li>
                Request deletion of your account and associated data (contact your school
                administrator or Sport Waikato).
              </li>
            </ul>
            <p>
              To exercise any of these rights, email{" "}
              <a href="mailto:hello@sportwaikato.org.nz" className="text-[#1B5E4B] underline">
                hello@sportwaikato.org.nz
              </a>
              . We will respond within 20 working days as required by New Zealand law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">8. Cookies</h2>
            <p>
              We use essential cookies to keep you signed in. We do not use advertising or tracking
              cookies. Our analytics (PostHog) uses a first-party cookie to recognise returning
              visitors; this data is anonymised and not shared with third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">9. Changes to this policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify users of material
              changes via the platform or by email. The latest version will always be available at
              this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">10. Contact</h2>
            <p>
              Sport Waikato
              <br />
              Hamilton, New Zealand
              <br />
              <a href="mailto:hello@sportwaikato.org.nz" className="text-[#1B5E4B] underline">
                hello@sportwaikato.org.nz
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-6 text-sm text-brand-dark/60">
          <Link to="/">Home</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
