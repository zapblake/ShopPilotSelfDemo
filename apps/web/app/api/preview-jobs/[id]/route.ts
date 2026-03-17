import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Mock: only the seeded job ID returns a result
  if (id === "seed-preview-job-001") {
    return successResponse({
      id,
      submittedUrl: "https://example-store.myshopify.com",
      normalizedDomain: "example-store.myshopify.com",
      status: "PENDING",
      email: "demo@zapsight.us",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      errorCode: null,
      errorMessage: null,
    });
  }

  return errorResponse("NOT_FOUND", `Preview job ${id} not found`, 404);
}
