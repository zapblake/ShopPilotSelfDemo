import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("admin_auth");
  if (!cookie || cookie.value !== process.env.ADMIN_PASSWORD) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing auth", 401);
  }

  const jobs = await prisma.previewJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      crawlRuns: {
        select: {
          status: true,
          startedAt: true,
          finishedAt: true,
          _count: { select: { discoveredPages: true } },
        },
      },
      renderedPages: {
        select: { renderStatus: true },
      },
      _count: {
        select: { events: true },
      },
    },
  });

  return successResponse(
    jobs.map((job) => ({
      id: job.id,
      submittedUrl: job.submittedUrl,
      normalizedDomain: job.normalizedDomain,
      status: job.status,
      email: job.email,
      createdAt: job.createdAt.toISOString(),
      crawlRun: job.crawlRuns[0]
        ? {
            status: job.crawlRuns[0].status,
            pageCount: job.crawlRuns[0]._count.discoveredPages,
          }
        : null,
      renderedPageCount: job.renderedPages.length,
      renderStatusSummary: job.renderedPages.length > 0
        ? [...new Set(job.renderedPages.map((rp) => rp.renderStatus))].join(", ")
        : "",
      eventCount: job._count.events,
    }))
  );
}
