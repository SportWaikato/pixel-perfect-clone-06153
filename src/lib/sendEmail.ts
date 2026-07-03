// Server-only email helper. This is intentionally NOT a createServerFn:
// exposing raw {to, subject, html} over HTTP lets anyone use the app as an
// open mail relay. Call this from authenticated server functions only.
interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmailServer({ to, subject, html }: SendEmailInput) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.VITE_FROM_EMAIL || "noreply@app.karawhiua.app";

  if (!to || !subject || !html) {
    return { ok: false, error: "to, subject, and html are required" };
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping email");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", res.status, body);
    return { ok: false, error: `Resend error ${res.status}: ${body}` };
  }

  return { ok: true, data: await res.json() };
}
