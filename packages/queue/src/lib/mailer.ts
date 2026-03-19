// Email is sent via the Vercel API endpoint (which has the Resend key).
// The worker just POSTs to it with a shared internal secret.

const VERCEL_API_BASE = "https://demo.zapsight.us";

export async function sendPreviewReadyEmail({
  to,
  domain,
  jobId,
}: {
  to: string;
  domain: string;
  jobId: string;
}) {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    console.warn("[mailer] INTERNAL_SECRET not set — skipping email to", to);
    return;
  }

  const res = await fetch(`${VERCEL_API_BASE}/api/internal/send-preview-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    },
    body: JSON.stringify({ to, domain, jobId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`send-preview-email failed: ${res.status} ${text}`);
  }

  console.log(`[mailer] Preview-ready email dispatched to ${to} for job ${jobId}`);
}
