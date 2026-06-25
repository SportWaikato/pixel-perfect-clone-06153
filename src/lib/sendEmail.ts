import { createServerFn } from "@tanstack/react-start";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const { to, subject, html } = input as SendEmailInput;
    if (!to || !subject || !html) throw new Error("to, subject, and html are required");
    if (typeof to !== "string" || typeof subject !== "string" || typeof html !== "string") {
      throw new Error("to, subject, and html must be strings");
    }
    return { to, subject, html };
  })
  .handler(async ({ data }) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.VITE_FROM_EMAIL || "noreply@app.karawhiua.app";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not set — skipping email");
      return { ok: false, error: "RESEND_API_KEY not configured" };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.to,
        subject: data.subject,
        html: data.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", res.status, body);
      return { ok: false, error: `Resend error ${res.status}: ${body}` };
    }

    return { ok: true, data: await res.json() };
  });
