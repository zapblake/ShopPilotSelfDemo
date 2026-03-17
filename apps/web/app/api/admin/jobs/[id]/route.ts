import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing secret", 401);
  }

  const { id } = await params;

  const job = await prisma.previewJob.findUnique({
    where: { id },
    include: {
      crawlRuns: {
        include: {
          discoveredPages: {
            orderBy: { score: "desc" },
          },
        },
      },
      renderedPages: {
        orderBy: { renderStartedAt: "asc" },
      },
      previewHosts: true,
      widgetConfig: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!job) {
    return errorResponse("NOT_FOUND", "Job not found", 404);
  }

  return successResponse(job);
}
