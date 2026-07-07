// ─── EMAIL 1: schoolRegistrationPending ─────────────────────────────────────

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeColour(value: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return "#0A4B39";
}

export function schoolRegistrationPending(
  firstName: string,
  schoolName: string,
  region: string,
  domain: string,
  houseNames: string,
) {
  const eFirstName = escapeHtml(firstName);
  const eSchoolName = escapeHtml(schoolName);
  const eRegion = escapeHtml(region);
  const eDomain = escapeHtml(domain);
  const eHouseNames = escapeHtml(houseNames);
  const subject = "Karawhiua - your registration is being reviewed";
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>School Registration Received</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1B5E4B;padding:32px 40px;text-align:center;">
              <img src="https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/assets/karawhiua-logo-white-green.png"
                   alt="Karawhiua" width="180"
                   style="display:block;margin:0 auto 10px auto;">
              <p style="color:#D103D1;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;">
                VIRTUAL SPORTS DAY
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px 40px 32px 40px;">

              <h1 style="color:#1B5E4B;font-size:24px;font-weight:800;margin:0 0 8px 0;">
                Registration received!
              </h1>
              <p style="color:#666;font-size:14px;margin:0 0 24px 0;">
                We'll be in touch within 1 business day
              </p>

              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
                Kia ora <strong>{{firstName}}</strong>,
              </p>
              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 28px 0;">
                Thanks for registering <strong>{{schoolName}}</strong> on Karawhiua!
                The Sport Waikato team will review your application within <strong>1 business day</strong>.
              </p>

              <!-- INFO BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background-color:#F0F7F4;border-left:4px solid #1B5E4B;border-radius:0 8px 8px 0;padding:20px;">

                    <p style="color:#1B5E4B;font-size:14px;font-weight:700;margin:0 0 14px 0;">Your registration details</p>

                    <!-- School row -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">
                      <tr>
                        <td width="28" valign="middle">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 22V12H15V22" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="color:#1A1A1A;font-size:14px;padding-left:8px;">
                          <strong>School:</strong> {{schoolName}}
                        </td>
                      </tr>
                    </table>

                    <!-- Region row -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">
                      <tr>
                        <td width="28" valign="middle">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#1B5E4B"/>
                          </svg>
                        </td>
                        <td style="color:#1A1A1A;font-size:14px;padding-left:8px;">
                          <strong>Region:</strong> {{region}}
                        </td>
                      </tr>
                    </table>

                    <!-- Domain row -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">
                      <tr>
                        <td width="28" valign="middle">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 6L12 13L2 6" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="color:#1A1A1A;font-size:14px;padding-left:8px;">
                          <strong>Domain:</strong> @{{domain}}
                        </td>
                      </tr>
                    </table>

                    <!-- Houses row -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" valign="middle">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="color:#1A1A1A;font-size:14px;padding-left:8px;">
                          <strong>Houses:</strong> {{houseNames}}
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- WHAT HAPPENS NEXT -->
              <p style="color:#1B5E4B;font-size:15px;font-weight:700;margin:0 0 16px 0;">
                What happens next:
              </p>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#D103D1;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">1</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      Sport Waikato reviews your registration
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#D103D1;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">2</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      You receive an approval email with your unique school join link
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#D103D1;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">3</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      Share the link with students and staff -- they join instantly
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#F0F7F4;padding:24px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px auto;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#1B5E4B" stroke-width="2"/>
                      <path d="M12 6V12L16 14" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </td>
                  <td style="color:#1B5E4B;font-size:14px;font-weight:700;">
                    Every move counts. Go for it!
                  </td>
                </tr>
              </table>
              <p style="color:#666;font-size:13px;margin:0 0 6px 0;">Questions? We're here to help.</p>
              <a href="mailto:support@sportwaikato.org.nz"
                 style="color:#1B5E4B;font-size:13px;font-weight:700;text-decoration:none;">
                support@sportwaikato.org.nz
              </a>
              <p style="color:#999;font-size:12px;margin:16px 0 0 0;">
                Karawhiua Virtual Sports Day &nbsp;|&nbsp; Sport Waikato
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  html = html
    .replace(/\{\{firstName\}\}/g, eFirstName)
    .replace(/\{\{schoolName\}\}/g, eSchoolName)
    .replace(/\{\{region\}\}/g, eRegion)
    .replace(/\{\{domain\}\}/g, eDomain)
    .replace(/\{\{houseNames\}\}/g, eHouseNames);
  return { subject, html };
}

// ─── EMAIL 2: schoolApproved ────────────────────────────────────────────────

export function schoolApproved(
  firstName: string,
  schoolName: string,
  joinCode: string,
  domain: string,
) {
  const eFirstName = escapeHtml(firstName);
  const eSchoolName = escapeHtml(schoolName);
  const eJoinCode = escapeHtml(joinCode);
  const eDomain = escapeHtml(domain);
  const subject = `${eSchoolName} is approved on Karawhiua`;
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your School is Approved!</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1B5E4B;padding:32px 40px;text-align:center;">
              <img src="https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/assets/karawhiua-logo-white-green.png"
                   alt="Karawhiua" width="180"
                   style="display:block;margin:0 auto 10px auto;">
              <p style="color:#D103D1;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;">
                VIRTUAL SPORTS DAY
              </p>
            </td>
          </tr>

          <!-- APPROVED BANNER -->
          <tr>
            <td style="background-color:#D103D1;padding:16px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td valign="middle" style="padding-right:10px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M22 4L12 14.01L9 11.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:1px;">
                    YOU'RE APPROVED -- LET'S GO!
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px 40px 32px 40px;">

              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
                Kia ora <strong>{{firstName}}</strong>,
              </p>
              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 28px 0;">
                Great news -- <strong>{{schoolName}}</strong> has been approved on Karawhiua!
                You're ready to get your school moving.
              </p>

              <!-- JOIN LINK BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background-color:#1B5E4B;border-radius:12px;padding:24px 28px;text-align:center;">
                    <p style="color:#D103D1;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px 0;">
                      YOUR SCHOOL JOIN LINK
                    </p>
                    <p style="color:#FFFFFF;font-size:15px;font-weight:600;margin:0 0 18px 0;word-break:break-all;">
                      https://app.karawhiua.app/join/{{joinCode}}
                    </p>
                    <a href="https://app.karawhiua.app/join/{{joinCode}}"
                       style="display:inline-block;background-color:#D103D1;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">
                      Open Join Link
                    </a>
                  </td>
                </tr>
              </table>

              <!-- DOMAIN INFO BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background-color:#F0F7F4;border-left:4px solid #1B5E4B;border-radius:0 8px 8px 0;padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" valign="top" style="padding-top:2px;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 6L12 13L2 6" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="color:#1B5E4B;font-size:14px;font-weight:700;margin:0 0 4px 0;">Auto-matching is active</p>
                          <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                            Students and staff with <strong>@{{domain}}</strong> email addresses will be
                            automatically matched to {{schoolName}} when they sign up -- no join link needed.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- GET STARTED -->
              <p style="color:#1B5E4B;font-size:15px;font-weight:700;margin:0 0 16px 0;">
                Get started in 4 steps:
              </p>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#1B5E4B;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">1</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Log in</strong> to your school admin dashboard at
                      <a href="https://app.karawhiua.app/auth" style="color:#1B5E4B;">app.karawhiua.app</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#1B5E4B;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">2</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Share your join link</strong> via school newsletter, website, QR posters, or assembly
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#1B5E4B;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">3</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Set up your first challenge</strong> to get students moving and earning points
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 4 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#1B5E4B;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">4</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Try Assembly Mode</strong> -- show live leaderboards at your next school assembly
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.karawhiua.app/auth"
                       style="display:inline-block;background-color:#1B5E4B;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                      Log in to your dashboard
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#F0F7F4;padding:24px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px auto;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="color:#1B5E4B;font-size:14px;font-weight:700;">
                    Every move counts. Go for it!
                  </td>
                </tr>
              </table>
              <p style="color:#666;font-size:13px;margin:0 0 6px 0;">Need help getting started?</p>
              <a href="mailto:support@sportwaikato.org.nz"
                 style="color:#1B5E4B;font-size:13px;font-weight:700;text-decoration:none;">
                support@sportwaikato.org.nz
              </a>
              <p style="color:#999;font-size:12px;margin:16px 0 0 0;">
                Karawhiua Virtual Sports Day &nbsp;|&nbsp; Sport Waikato
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  html = html
    .replace(/\{\{firstName\}\}/g, eFirstName)
    .replace(/\{\{schoolName\}\}/g, eSchoolName)
    .replace(/\{\{joinCode\}\}/g, eJoinCode)
    .replace(/\{\{domain\}\}/g, eDomain);
  return { subject, html };
}

// ─── EMAIL 3: schoolRejected ────────────────────────────────────────────────

export function schoolRejected(firstName: string, schoolName: string, reason: string) {
  const eFirstName = escapeHtml(firstName);
  const eSchoolName = escapeHtml(schoolName);
  const eReason = escapeHtml(reason);
  const subject = "Karawhiua registration - action needed";
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Action Needed</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1B5E4B;padding:32px 40px;text-align:center;">
              <img src="https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/assets/karawhiua-logo-white-green.png"
                   alt="Karawhiua" width="180"
                   style="display:block;margin:0 auto 10px auto;">
              <p style="color:#D103D1;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;">
                VIRTUAL SPORTS DAY
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px 40px 32px 40px;">

              <h1 style="color:#1B5E4B;font-size:24px;font-weight:800;margin:0 0 24px 0;">
                Registration -- action needed
              </h1>

              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
                Kia ora <strong>{{firstName}}</strong>,
              </p>
              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                Thank you for registering <strong>{{schoolName}}</strong> on Karawhiua.
                Unfortunately we were unable to approve your registration at this time.
              </p>

              <!-- REASON BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background-color:#FDF0F8;border-left:4px solid #B600B8;border-radius:0 8px 8px 0;padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" valign="top" style="padding-top:2px;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="#B600B8" stroke-width="2"/>
                            <line x1="12" y1="8" x2="12" y2="12" stroke="#B600B8" stroke-width="2" stroke-linecap="round"/>
                            <line x1="12" y1="16" x2="12.01" y2="16" stroke="#B600B8" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="color:#B600B8;font-size:14px;font-weight:700;margin:0 0 6px 0;">Reason for rejection:</p>
                          <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">{{reason}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 28px 0;">
                If you believe this is an error or would like to discuss your registration,
                please get in touch with our team and we'll be happy to help.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:support@sportwaikato.org.nz"
                       style="display:inline-block;background-color:#1B5E4B;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                      Contact Support
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#F0F7F4;padding:24px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px auto;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="color:#1B5E4B;font-size:14px;font-weight:700;">
                    Every move counts. Go for it!
                  </td>
                </tr>
              </table>
              <a href="mailto:support@sportwaikato.org.nz"
                 style="color:#1B5E4B;font-size:13px;font-weight:700;text-decoration:none;">
                support@sportwaikato.org.nz
              </a>
              <p style="color:#999;font-size:12px;margin:16px 0 0 0;">
                Karawhiua Virtual Sports Day &nbsp;|&nbsp; Sport Waikato
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  html = html
    .replace(/\{\{firstName\}\}/g, eFirstName)
    .replace(/\{\{schoolName\}\}/g, eSchoolName)
    .replace(/\{\{reason\}\}/g, eReason);
  return { subject, html };
}

// ─── EMAIL 4: studentWelcome ────────────────────────────────────────────────

export function studentWelcome(
  firstName: string,
  schoolName: string,
  houseName: string,
  houseColour: string,
) {
  const eFirstName = escapeHtml(firstName);
  const eSchoolName = escapeHtml(schoolName);
  const eHouseName = escapeHtml(houseName);
  const safeColourValue = safeColour(houseColour);
  const subject = `Welcome to Karawhiua, ${eFirstName}`;
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Karawhiua!</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1B5E4B;padding:32px 40px;text-align:center;">
              <img src="https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/assets/karawhiua-logo-white-green.png"
                   alt="Karawhiua" width="180"
                   style="display:block;margin:0 auto 10px auto;">
              <p style="color:#D103D1;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;">
                VIRTUAL SPORTS DAY
              </p>
            </td>
          </tr>

          <!-- WELCOME BANNER -->
          <tr>
            <td style="background-color:#D103D1;padding:16px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td valign="middle" style="padding-right:10px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:1px;">
                    WELCOME -- EVERY MOVE COUNTS!
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px 40px 32px 40px;">

              <h1 style="color:#1B5E4B;font-size:24px;font-weight:800;margin:0 0 20px 0;">
                Kia ora {{firstName}}!
              </h1>

              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                You've joined <strong>{{schoolName}}</strong> on Karawhiua --
                the virtual sports day platform where every move counts.
              </p>

              <!-- HOUSE BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background-color:#F0F7F4;border-left:4px solid {{houseColour}};border-radius:0 8px 8px 0;padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" valign="top" style="padding-top:2px;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="{{houseColour}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 22V12H15V22" stroke="{{houseColour}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="color:#1B5E4B;font-size:14px;font-weight:700;margin:0 0 4px 0;">Your house: {{houseName}}</p>
                          <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                            Start logging activities to earn points for your house and climb the leaderboard!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- HOW IT WORKS -->
              <p style="color:#1B5E4B;font-size:15px;font-weight:700;margin:0 0 16px 0;">
                How it works:
              </p>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#D103D1;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">1</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Log your activity</strong> -- walking, running, sport, dance, anything physical counts
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#D103D1;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">2</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Earn points</strong> for your house leaderboard and unlock badges along the way
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
                <tr>
                  <td width="36" valign="top">
                    <div style="background-color:#D103D1;color:#fff;font-size:12px;font-weight:700;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;">3</div>
                  </td>
                  <td style="padding-left:8px;">
                    <p style="color:#1A1A1A;font-size:14px;margin:0;line-height:1.5;">
                      <strong>Compete</strong> with your school and against schools across Aotearoa New Zealand
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.karawhiua.app/dashboard"
                       style="display:inline-block;background-color:#1B5E4B;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">
                      Start logging activity
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#F0F7F4;padding:24px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px auto;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#1B5E4B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="color:#1B5E4B;font-size:14px;font-weight:700;">
                    Every move counts. Go for it!
                  </td>
                </tr>
              </table>
              <a href="mailto:support@sportwaikato.org.nz"
                 style="color:#1B5E4B;font-size:13px;font-weight:700;text-decoration:none;">
                support@sportwaikato.org.nz
              </a>
              <p style="color:#999;font-size:12px;margin:16px 0 0 0;">
                Karawhiua Virtual Sports Day &nbsp;|&nbsp; Sport Waikato
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  html = html
    .replace(/\{\{firstName\}\}/g, eFirstName)
    .replace(/\{\{schoolName\}\}/g, eSchoolName)
    .replace(/\{\{houseName\}\}/g, eHouseName)
    .replace(/\{\{houseColour\}\}/g, safeColourValue);
  return { subject, html };
}
