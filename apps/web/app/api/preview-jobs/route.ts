import { NextRequest } from "next/server";
import { Queue } from "bullmq";
import { successResponse, errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { normalizeUrl } from "@/lib/url-utils";

let queue: Queue | null = null;

function getQueue() {
  if (!queue) {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const parsed = new URL(redisUrl);
    queue = new Queue("preview-jobs", {
      connection: {
        host: parsed.hostname,
        port: Number(parsed.port) || 6379,
        password: parsed.password || undefined,
        maxRetriesPerRequest: null,
      },
    });
  }
  return queue;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, email, storeName } = body as {
      url?: string;
      email?: string;
      storeName?: string;
    };

    if (!url || typeof url !== "string") {
      return errorResponse("VALIDATION_ERROR", "url is required", 400);
    }

    const normalized = normalizeUrl(url);
    if (!normalized) {
      return errorResponse("VALIDATION_ERROR", "Invalid URL format", 400);
    }

    const job = await prisma.previewJob.create({
      data: {
        submittedUrl: url,
        normalizedDomain: normalized.domain,
        status: "QUEUED",
        email: email || null,
      },
    });

    await getQueue().add("preview", {
      previewJobId: job.id,
      submittedUrl: normalized.url,
      normalizedDomain: normalized.domain,
    });

    if (storeName) {
      await prisma.widgetPreviewConfig.create({
        data: { previewJobId: job.id, storeName },
      });
    }

    logger.info(
      { jobId: job.id, url, domain: normalized.domain },
      "Preview job created and enqueued"
    );

    return successResponse(
      {
        jobId: job.id,
        status: "QUEUED",
        statusUrl: `/preview-jobs/${job.id}`,
      },
      201
    );
  } catch (err) {
    logger.error({ error: err }, "Failed to create preview job");
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
  }
}
