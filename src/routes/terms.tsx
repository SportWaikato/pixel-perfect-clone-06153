import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Karawhiua" },
      {
        name: "description",
        content:
          "Terms of Service for Karawhiua, the virtual sports day platform from Sport Waikato.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
        <h1 className="mb-2 font-accent text-3xl font-bold text-brand-dark">Terms of Service</h1>
        <p className="mb-10 text-sm text-gray-500">Effective: 1 July 2025</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-brand-dark">1. Introduction</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of Karawhiua (&quot;the
              platform&quot;), a virtual sports day platform operated by Sport Waikato. By creating
              an account or using the platform, you agree to these Terms. If you are under 18, your
              school has authorised your participation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">2. Who can use the platform</h2>
            <p>
              Karawhiua is designed for school students, teachers, and school administrators in
              participating schools. Accounts are created through an invitation or registration
              process managed by your school. You must use your real name and school email address.
              You must not share your login credentials with anyone else.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">3. Acceptable use</h2>
            <p>When using Karawhiua, you agree to:</p>
            <ul className="list-disc pl-6">
              <li>
                Log only your own genuine physical activity. Falsifying activity logs (e.g., logging
                activities you did not do, or logging someone else&apos;s activity) undermines the
                programme and may result in account suspension.
              </li>
              <li>
                Treat other users with respect. Do not post offensive, harmful, or inappropriate
                content anywhere on the platform.
              </li>
              <li>
                Not attempt to access data you are not authorised to view, or interfere with the
                platform&apos;s operation (e.g., scraping, automated access, attempting to bypass
                security controls).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">4. Account management</h2>
            <p>
              Your school administrator manages your account and can suspend or remove access. Sport
              Waikato may also suspend or terminate accounts that violate these Terms. You may
              request deletion of your account by contacting your school administrator or Sport
              Waikato at{" "}
              <a href="mailto:hello@sportwaikato.org.nz" className="text-[#1B5E4B] underline">
                hello@sportwaikato.org.nz
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">5. Points and leaderboards</h2>
            <p>
              Points are awarded based on activity duration and type, as set by your school and
              challenge organisers. Points have no monetary value and cannot be exchanged for cash
              or prizes unless your school chooses to offer rewards at its own discretion. Sport
              Waikato reserves the right to adjust or remove points that are found to have been
              earned fraudulently.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">6. Intellectual property</h2>
            <p>
              The Karawhiua name, logo, and platform design are the property of Sport Waikato. You
              may not copy, modify, or redistribute the platform or its branding without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">7. Third-party services</h2>
            <p>The platform integrates with third-party services including:</p>
            <ul className="list-disc pl-6">
              <li>
                <strong>Google Sign-In</strong> — for authentication. Use of Google Sign-In is
                subject to Google&apos;s Terms of Service and Privacy Policy.
              </li>
              <li>
                <strong>Supabase</strong> — for data storage and backend services.
              </li>
            </ul>
            <p>
              We are not responsible for the availability or practices of these third-party
              services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">8. Disclaimer</h2>
            <p>
              Karawhiua is provided &quot;as is&quot;. While we strive to keep the platform
              available and accurate, Sport Waikato makes no warranties about uninterrupted access
              or error-free operation. To the extent permitted by New Zealand law, Sport Waikato is
              not liable for any loss or damage arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">9. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the platform after
              changes are posted constitutes acceptance of the updated Terms. Material changes will
              be communicated via the platform or email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">10. Governing law</h2>
            <p>
              These Terms are governed by the laws of New Zealand. Any disputes will be resolved in
              the courts of New Zealand.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark">11. Contact</h2>
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
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
