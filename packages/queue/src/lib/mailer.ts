import nodemailer from "nodemailer";

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPreviewReadyEmail({
  to,
  domain,
  jobId,
}: {
  to: string;
  domain: string;
  jobId: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[mailer] SMTP not configured — skipping email to", to);
    return;
  }

  const previewUrl = `https://demo.zapsight.us/demo/${jobId}`;
  const bookUrl = "https://calendly.com/blake-zapsight/30min";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:22px;font-weight:700;color:white;">
                <span style="color:#f97316;">Zap</span>Sight
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:white;line-height:1.3;">
                Your Shop Pilot demo is ready 🎉
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#9ca3af;line-height:1.6;">
                We've built a live preview of Shop Pilot running on <strong style="color:white;">${domain}</strong>.
                Click below to see exactly what your customers would experience.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:#f97316;border-radius:10px;">
                    <a href="${previewUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:white;text-decoration:none;">
                      View Your Demo →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.6;">
                The demo shows Shop Pilot embedded on your site — try chatting with it, ask for product recommendations, and see how it handles a real conversation.
              </p>

              <hr style="margin:28px 0;border:none;border-top:1px solid rgba(255,255,255,0.06);">

              <p style="margin:0 0 8px;font-size:15px;color:white;font-weight:600;">
                Want to see it with your real inventory?
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;line-height:1.6;">
                This demo uses sample data. A full setup connects directly to your live catalog — personalized recommendations, real stock, your branding.
              </p>
              <a href="${bookUrl}"
                 style="font-size:14px;color:#f97316;text-decoration:none;font-weight:500;">
                Book a 20-min call →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#4b5563;">
                ZapSight · AI-powered shopping for furniture retailers ·
                <a href="https://zapsight.us" style="color:#6b7280;">zapsight.us</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await getTransport().sendMail({
    from: `"ZapSight Demo" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Shop Pilot demo for ${domain} is ready`,
    html,
  });

  console.log(`[mailer] Preview-ready email sent to ${to} for job ${jobId}`);
}
