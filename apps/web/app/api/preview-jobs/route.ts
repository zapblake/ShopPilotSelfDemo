import { NextRequest } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { successResponse, errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, email } = body as { url?: string; email?: string };

    if (!url || typeof url !== "string") {
      return errorResponse("VALIDATION_ERROR", "url is required", 400);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid URL format", 400);
    }

    if (email && typeof email !== "string") {
      return errorResponse("VALIDATION_ERROR", "email must be a string", 400);
    }

    const jobId = createId();
    const normalizedDomain = parsedUrl.hostname;

    logger.info({ jobId, url, normalizedDomain }, "Preview job created");

    return successResponse(
      {
        id: jobId,
        submittedUrl: url,
        normalizedDomain,
        status: "PENDING",
        email: email ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        errorCode: null,
        errorMessage: null,
      },
      201
    );
  } catch (err) {
    logger.error({ error: err }, "Failed to create preview job");
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
  }
}
