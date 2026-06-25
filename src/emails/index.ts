import { LOGOS } from "@/lib/logos";

const BRAND_GREEN = "#0A4B39";
const BRAND_MID_GREEN = "#118061";
const BRAND_PURPLE = "#D103D1";
const BG = "#F5F5F0";
const SUPPORT_EMAIL = "support@sportwaikato.org.nz";

function sharedHeader(): string {
  return `
    <tr>
      <td style="background:${BRAND_GREEN};border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
        <img src="${LOGOS.WHITE_ON_GREEN}" alt="Karawhiua" width="180" style="display:block;margin:0 auto 8px;" />
        <p style="margin:0;color:${BRAND_PURPLE};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
          VIRTUAL SPORTS DAY
        </p>
      </td>
    </tr>
  `;
}

function sharedFooter(): string {
  return `
    <tr>
      <td style="background:#F0F7F4;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
        <p style="margin:0 0 8px;color:${BRAND_GREEN};font-size:15px;font-weight:700;">
          Every move counts. Go for it! 🏃
        </p>
        <p style="margin:0 0 4px;font-size:13px;color:#999;">
          Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_GREEN};font-weight:700;text-decoration:none;">${SUPPORT_EMAIL}</a>
        </p>
        <p style="margin:0;font-size:12px;color:#999;">
          Karawhiua Virtual Sports Day | Sport Waikato
        </p>
      </td>
    </tr>
  `;
}

function wrapBody(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Karawhiua</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        ${sharedHeader()}
        <tr><td style="padding:40px;">
          ${bodyContent}
        </td></tr>
        ${sharedFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function stepCircle(number: number, bgColor: string = BRAND_PURPLE): string {
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${bgColor};color:#fff;font-size:12px;font-weight:700;margin-right:8px;flex-shrink:0;">${number}</span>`;
}

function infoBox(content: string): string {
  return `<div style="background:#F0F7F4;border-left:4px solid ${BRAND_GREEN};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
    ${content}
  </div>`;
}

function ctaButton(text: string, url: string, bg: string = BRAND_GREEN): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:${bg};border-radius:8px;padding:14px 36px;text-align:center;">
        <a href="${url}" style="color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;display:inline-block;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

function joinLinkBox(label: string, url: string): string {
  return `<div style="background:${BRAND_GREEN};border-radius:12px;padding:24px 28px;text-align:center;margin:20px 0;">
    <p style="margin:0 0 8px;color:${BRAND_PURPLE};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">${label}</p>
    <p style="margin:0 0 16px;color:#ffffff;font-size:15px;word-break:break-all;">${url}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:${BRAND_PURPLE};border-radius:8px;padding:12px 28px;text-align:center;">
          <a href="${url}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:inline-block;">
            Open Join Link →
          </a>
        </td>
      </tr>
    </table>
  </div>`;
}

// ─── EMAIL 1: schoolRegistrationPending ─────────────────────────────────────

export function schoolRegistrationPending(
  firstName: string,
  schoolName: string,
  region: string,
  domain: string,
  houseNames: string,
) {
  const subject = `Karawhiua — your registration is being reviewed`;
  const html = wrapBody(`
    <h1 style="color:${BRAND_GREEN};font-size:24px;font-weight:800;margin:0 0 4px;">Registration received! 🎉</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">We'll be in touch within 1 business day</p>

    <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">Kia ora ${firstName},</p>
    <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
      Thanks for registering <strong>${schoolName}</strong> on Karawhiua!
      We've received your application and the Sport Waikato team will review it within 1 business day.
    </p>

    ${infoBox(`
      <p style="margin:0 0 8px;color:${BRAND_GREEN};font-weight:700;font-size:13px;">Your registration details</p>
      <p style="margin:0 0 4px;font-size:14px;color:#333;">🏫 School: ${schoolName}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#333;">📍 Region: ${region}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#333;">📧 Domain: @${domain}</p>
      <p style="margin:0 0 0;font-size:14px;color:#333;">🏠 Houses: ${houseNames}</p>
    `)}

    <p style="color:${BRAND_GREEN};font-weight:700;font-size:15px;margin:24px 0 12px;">What happens next:</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;color:#333;line-height:1.6;">
      <tr><td style="padding:0 0 8px;">${stepCircle(1)} Sport Waikato reviews your registration</td></tr>
      <tr><td style="padding:0 0 8px;">${stepCircle(2)} You receive an approval email with your unique school join link</td></tr>
      <tr><td style="padding:0;">${stepCircle(3)} Share the link with students and staff — they join instantly</td></tr>
    </table>
  `);
  return { subject, html };
}

// ─── EMAIL 2: schoolApproved ────────────────────────────────────────────────

export function schoolApproved(firstName: string, schoolName: string, joinCode: string, domain: string) {
  const joinUrl = `https://app.karawhiua.app/join/${joinCode}`;
  const loginUrl = `https://app.karawhiua.app/auth`;
  const subject = `🎉 ${schoolName} is approved on Karawhiua!`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Karawhiua</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        ${sharedHeader()}
        <tr>
          <td style="background:${BRAND_PURPLE};padding:16px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:800;">🎉 YOU'RE APPROVED — LET'S GO!</p>
          </td>
        </tr>
        <tr><td style="padding:40px;">
          <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">Kia ora ${firstName},</p>
          <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
            Great news — <strong>${schoolName}</strong> has been approved on Karawhiua!
            You're ready to get your school moving.
          </p>

          ${joinLinkBox("YOUR SCHOOL JOIN LINK", joinUrl)}

          ${infoBox(`
            <p style="margin:0 0 4px;color:${BRAND_GREEN};font-weight:700;font-size:13px;">📧 Auto-matching is active</p>
            <p style="margin:0;font-size:14px;color:#333;">
              Students and staff with <strong>@${domain}</strong> email addresses will be automatically matched to ${schoolName} when they sign up — no join link needed.
            </p>
          `)}

          <p style="color:${BRAND_GREEN};font-weight:700;font-size:15px;margin:24px 0 12px;">Get started in 4 steps:</p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;color:#333;line-height:1.6;">
            <tr><td style="padding:0 0 8px;">${stepCircle(1, BRAND_GREEN)} Log in to your school admin dashboard at app.karawhiua.app</td></tr>
            <tr><td style="padding:0 0 8px;">${stepCircle(2, BRAND_GREEN)} Share your join link via school newsletter, website, QR posters, or assembly</td></tr>
            <tr><td style="padding:0 0 8px;">${stepCircle(3, BRAND_GREEN)} Set up your first challenge to get students moving and earning points</td></tr>
            <tr><td style="padding:0;">${stepCircle(4, BRAND_GREEN)} Try Assembly Mode — show live leaderboards at your next school assembly</td></tr>
          </table>

          ${ctaButton("Log in to your dashboard →", loginUrl)}
        </td></tr>
        ${sharedFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html };
}

// ─── EMAIL 3: schoolRejected ────────────────────────────────────────────────

export function schoolRejected(firstName: string, schoolName: string, reason: string) {
  const subject = `Karawhiua registration — action needed`;
  const html = wrapBody(`
    <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">Kia ora ${firstName},</p>
    <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
      Thank you for registering <strong>${schoolName}</strong> on Karawhiua.
      Unfortunately we were unable to approve your registration at this time.
    </p>

    ${infoBox(`
      <p style="margin:0 0 4px;color:${BRAND_GREEN};font-weight:700;font-size:13px;">Reason for rejection:</p>
      <p style="margin:0;font-size:14px;color:#333;">${reason}</p>
    `)}

    <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
      If you believe this is an error or would like to discuss your registration,
      please get in touch with our team and we'll be happy to help.
    </p>

    ${ctaButton("Contact Support", `mailto:${SUPPORT_EMAIL}`)}
  `);
  return { subject, html };
}

// ─── EMAIL 4: studentWelcome ────────────────────────────────────────────────

export function studentWelcome(firstName: string, schoolName: string, houseName: string, houseColour: string) {
  const subject = `Welcome to Karawhiua, ${firstName}! 🏃`;
  const html = wrapBody(`
    <h1 style="color:${BRAND_GREEN};font-size:24px;font-weight:800;margin:0 0 16px;">Kia ora ${firstName}! 👋</h1>

    <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
      You've joined <strong>${schoolName}</strong> on Karawhiua —
      the virtual sports day platform where every move counts.
    </p>

    <div style="background:#F0F7F4;border-left:4px solid ${houseColour};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:15px;color:#333;"><strong>🏠 Your house: ${houseName}</strong></p>
      <p style="margin:0;font-size:14px;color:#555;">
        Start logging activities to earn points for your house!
      </p>
    </div>

    <p style="color:${BRAND_GREEN};font-weight:700;font-size:15px;margin:24px 0 12px;">How it works:</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;color:#333;line-height:1.6;">
      <tr><td style="padding:0 0 8px;">${stepCircle(1)} Log your physical activity — walking, running, sport, anything counts</td></tr>
      <tr><td style="padding:0 0 8px;">${stepCircle(2)} Earn points for your house leaderboard</td></tr>
      <tr><td style="padding:0;">${stepCircle(3)} Compete with your school and across NZ</td></tr>
    </table>

    ${ctaButton("Start logging activity →", "https://app.karawhiua.app/dashboard")}
  `);
  return { subject, html };
}
