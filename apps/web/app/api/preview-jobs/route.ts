import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { successResponse, errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { normalizeUrl } from "@/lib/url-utils";

// Queue enqueue is best-effort — if Redis is unavailable, job is still created in DB
async function tryEnqueue(jobId: string, submittedUrl: string, normalizedDomain: string) {
  try {
    const redisUrl = process.env.REDIS_URL ?? "";
    if (!redisUrl || redisUrl.includes("localhost")) {
      logger.warn("REDIS_URL not configured or localhost — skipping queue enqueue");
      return;
    }
    const { Queue } = await import("bullmq");
    const parsed = new URL(redisUrl);
    const q = new Queue("preview-jobs", {
      connection: {
        host: parsed.hostname,
        port: Number(parsed.port) || 6379,
        password: parsed.password || undefined,
        username: parsed.username || undefined,
        tls: parsed.protocol === "rediss:" ? {} : undefined,
        maxRetriesPerRequest: null,
      },
    });
    await q.add("preview", { previewJobId: jobId, submittedUrl, normalizedDomain });
    await q.close();
  } catch (err) {
    logger.warn({ error: err }, "Failed to enqueue preview job — will need manual trigger");
  }
}

async function parseBody(request: NextRequest): Promise<{ url?: string; email?: string; storeName?: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  // Handle HTML form POST (application/x-www-form-urlencoded)
  const text = await request.text();
  const params = new URLSearchParams(text);
  return {
    url: params.get("url") ?? undefined,
    email: params.get("email") ?? undefined,
    storeName: params.get("storeName") ?? undefined,
  };
}

export async function POST(request: NextRequest) {
  const isFormSubmission = (request.headers.get("content-type") ?? "").includes("application/x-www-form-urlencoded");

  try {
    const { url, email, storeName } = await parseBody(request);

    if (!url || typeof url !== "string") {
      if (isFormSubmission) return NextResponse.redirect(new URL("/?error=url_required", request.url), 303);
      return errorResponse("VALIDATION_ERROR", "url is required", 400);
    }

    const normalized = normalizeUrl(url);
    if (!normalized) {
      // Check if it looks like someone entered a zapsight URL
      const lowerUrl = url.toLowerCase();
      const isOwnDomain = lowerUrl.includes("zapsight.com") || lowerUrl.includes("zapsight.us");
      const errorParam = isOwnDomain ? "own_domain" : "invalid_url";
      if (isFormSubmission) return NextResponse.redirect(new URL(`/?error=${errorParam}`, request.url), 303);
      return errorResponse("VALIDATION_ERROR", isOwnDomain ? "Please enter your store URL, not a ZapSight URL" : "Invalid URL format", 400);
    }

    const job = await prisma.previewJob.create({
      data: {
        submittedUrl: url,
        normalizedDomain: normalized.domain,
        status: "QUEUED",
        email: email || null,
      },
    });

    // Best-effort queue enqueue
    tryEnqueue(job.id, normalized.url, normalized.domain).catch(() => {});

    if (storeName) {
      await prisma.widgetPreviewConfig.create({
        data: { previewJobId: job.id, storeName },
      }).catch(() => {});
    }

    logger.info({ jobId: job.id, url, domain: normalized.domain }, "Preview job created");

    // Fire-and-forget email notification
    try {
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
        });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://demo.zapsight.us";
        const statusUrl = `${appUrl}/preview-jobs/${job.id}`;

        transporter.sendMail({
          from: smtpUser,
          to: process.env.NOTIFICATION_EMAIL_TO || "blake@zapsight.com",
          subject: `🚀 New ZapSight Preview Request — ${normalized.domain}`,
          text: `New preview request.\n\nDomain: ${normalized.domain}\nEmail: ${email || "not provided"}\nJob ID: ${job.id}\nStatus: ${statusUrl}`,
        }).catch(() => {});

        if (email) {
          transporter.sendMail({
            from: smtpUser,
            to: email,
            subject: `Your ZapSight preview for ${normalized.domain} is being built ✨`,
            text: `Hi,\n\nWe're building your Shop Pilot preview for ${normalized.domain}.\n\nWatch it build: ${statusUrl}\n\n— Blake at ZapSight`,
          }).catch(() => {});
        }
      }
    } catch { /* silent */ }

    // Form submission → redirect to status page
    if (isFormSubmission) {
      const host = request.headers.get('host') || '';
      const proto = host.includes('localhost') ? 'http' : 'https';
      const appUrl = `${proto}://${host}`;
      return NextResponse.redirect(new URL(`/preview-jobs/${job.id}`, appUrl), 303);
    }

    return successResponse({ jobId: job.id, status: "QUEUED", statusUrl: `/preview-jobs/${job.id}` }, 201);
  } catch (err) {
    logger.error({ error: err }, "Failed to create preview job");
    if (isFormSubmission) return NextResponse.redirect(new URL("/?error=server_error", request.url), 303);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
  }
}
