import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.previewJob.findUnique({
    where: { id },
    include: {
      crawlRuns: {
        include: { discoveredPages: true },
      },
    },
  });

  if (!job) {
    return errorResponse("NOT_FOUND", `Preview job ${id} not found`, 404);
  }

  const crawlRun = job.crawlRuns[0] ?? null;

  return successResponse({
    id: job.id,
    submittedUrl: job.submittedUrl,
    normalizedDomain: job.normalizedDomain,
    status: job.status,
    email: job.email,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    crawlRun: crawlRun
      ? {
          status: crawlRun.status,
          startedAt: crawlRun.startedAt?.toISOString() ?? null,
          finishedAt: crawlRun.finishedAt?.toISOString() ?? null,
          pageCount: crawlRun.discoveredPages.length,
        }
      : null,
    discoveredPages: crawlRun
      ? crawlRun.discoveredPages.map((p) => ({
          id: p.id,
          url: p.url,
          normalizedUrl: p.normalizedUrl,
          title: p.title,
          statusCode: p.statusCode,
          pageType: p.pageType,
          score: p.score,
          reasoning: p.reasoning,
          selected: p.selected,
        }))
      : [],
    selectedPages: crawlRun
      ? crawlRun.discoveredPages
          .filter((p) => p.selected)
          .map((p) => ({
            id: p.id,
            url: p.url,
            pageType: p.pageType,
            title: p.title,
          }))
      : [],
  });
}
