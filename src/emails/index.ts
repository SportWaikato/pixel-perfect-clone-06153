const BRAND_GREEN = "#0B4B39";
const LOGO_URL = "https://app.karawhiua.app/KarawhiuaLogo.png";
const APP_NAME = "Karawhiua Virtual Sports Day";
const SUPPORT_EMAIL = "support@sportwaikato.org.nz";

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND_GREEN};padding:32px 24px;text-align:center;">
            <img src="${LOGO_URL}" alt="${APP_NAME}" height="60" style="display:block;margin:0 auto 12px;" />
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${APP_NAME}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px 24px;color:#333;font-size:15px;line-height:1.6;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 24px;background:#f9f9f9;text-align:center;font-size:13px;color:#888;border-top:1px solid #eee;">
            <p style="margin:0 0 4px;">${APP_NAME} | <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_GREEN};text-decoration:none;">${SUPPORT_EMAIL}</a></p>
            <p style="margin:0;font-size:12px;">Sport Waikato — getting our communities moving</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function schoolRegistrationPending(firstName: string, schoolName: string, adminEmail: string) {
  const subject = `Karawhiua — ${schoolName} registration is being reviewed`;
  const html = wrap(`
    <p style="font-size:18px;color:#111;margin:0 0 16px;">Kia ora ${firstName},</p>
    <p style="margin:0 0 16px;">Thank you for registering <strong>${schoolName}</strong> for Karawhiua Virtual Sports Day.</p>
    <p style="margin:0 0 16px;">Your registration is now being reviewed by the Sport Waikato team. We aim to get back to you within <strong>1 business day</strong>.</p>
    <p style="margin:0 0 16px;">Once approved, we'll send you a join link and instructions to share with your students so they can get started.</p>
    <p style="margin:0 0 16px;">If you have any questions in the meantime, please reach out to <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_GREEN};text-decoration:underline;">${SUPPORT_EMAIL}</a>.</p>
    <div style="border-left:4px solid ${BRAND_GREEN};background:#f0f7f4;padding:12px 16px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#555;"><strong>Registered by:</strong> ${firstName} — ${adminEmail}</p>
    </div>
    <p style="margin:20px 0 0;color:#888;font-size:14px;">Ngā mihi nui,<br/>The Karawhiua Team</p>
  `);
  return { subject, html };
}

export function schoolApproved(firstName: string, schoolName: string, joinCode: string, domain: string) {
  const joinUrl = `https://app.karawhiua.app/join/${joinCode}`;
  const loginUrl = `https://app.karawhiua.app/auth`;
  const subject = `Your school is approved on Karawhiua!`;
  const html = wrap(`
    <p style="font-size:18px;color:#111;margin:0 0 16px;">Kia ora ${firstName},</p>
    <p style="margin:0 0 16px;">Great news — <strong>${schoolName}</strong> has been approved for Karawhiua Virtual Sports Day!</p>
    <p style="margin:0 0 20px;">Here's your school's unique join link. Share it with your students so they can sign up:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:${BRAND_GREEN};border-radius:6px;padding:14px 28px;text-align:center;">
          <a href="${joinUrl}" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">
            Join ${schoolName} on Karawhiua →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;">Or copy this link: <a href="${joinUrl}" style="color:${BRAND_GREEN};word-break:break-all;">${joinUrl}</a></p>
    <div style="border-left:4px solid ${BRAND_GREEN};background:#f0f7f4;padding:12px 16px;margin:20px 0;border-radius:4px;">
      <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>How it works:</strong></p>
      <p style="margin:0;font-size:13px;color:#555;">Students with email addresses ending in <strong>@${domain}</strong> will be automatically matched to ${schoolName}. Others can use the join link above.</p>
    </div>
    <p style="margin:0 0 16px;">You can log in to your admin dashboard here: <a href="${loginUrl}" style="color:${BRAND_GREEN};text-decoration:underline;">${loginUrl}</a></p>
    <p style="margin:20px 0 0;color:#888;font-size:14px;">Ngā mihi nui,<br/>The Karawhiua Team</p>
  `);
  return { subject, html };
}

export function schoolRejected(firstName: string, schoolName: string, reason: string) {
  const subject = `Karawhiua registration — action needed`;
  const html = wrap(`
    <p style="font-size:18px;color:#111;margin:0 0 16px;">Kia ora ${firstName},</p>
    <p style="margin:0 0 16px;">We're writing to let you know that we were unable to approve the registration for <strong>${schoolName}</strong>.</p>
    <div style="border-left:4px solid #d42b2b;background:#fff5f5;padding:12px 16px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-size:14px;color:#333;"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="margin:0 0 16px;">If you'd like to resubmit or discuss this further, please email <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_GREEN};text-decoration:underline;">${SUPPORT_EMAIL}</a> and we'll be happy to help.</p>
    <p style="margin:20px 0 0;color:#888;font-size:14px;">Ngā mihi nui,<br/>The Karawhiua Team</p>
  `);
  return { subject, html };
}

export function studentWelcome(firstName: string, schoolName: string, houseName: string) {
  const subject = `Welcome to Karawhiua, ${firstName}!`;
  const html = wrap(`
    <p style="font-size:18px;color:#111;margin:0 0 16px;">Kia ora ${firstName},</p>
    <p style="margin:0 0 16px;">Welcome to <strong>Karawhiua Virtual Sports Day</strong>!</p>
    <p style="margin:0 0 16px;">You're all set as part of <strong>${schoolName}</strong> in <strong>${houseName}</strong>.</p>
    <p style="margin:0 0 20px;">Get started by logging in here:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:${BRAND_GREEN};border-radius:6px;padding:14px 28px;text-align:center;">
          <a href="https://app.karawhiua.app/auth" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">
            Log in to Karawhiua →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;">Log in here: <a href="https://app.karawhiua.app/auth" style="color:${BRAND_GREEN};text-decoration:underline;">app.karawhiua.app/auth</a></p>
    <p style="margin:0 0 16px;">Start logging activities, earn points for your house, and check out the leaderboard!</p>
    <p style="margin:20px 0 0;color:#888;font-size:14px;">Ngā mihi nui,<br/>The Karawhiua Team</p>
  `);
  return { subject, html };
}
