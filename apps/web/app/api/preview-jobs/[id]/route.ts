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
      renderedPages: true,
      widgetConfig: true,
      events: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, eventName: true, createdAt: true },
      },
      _count: { select: { events: true } },
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
    renderedPages: job.renderedPages.map((rp) => ({
      id: rp.id,
      sourceUrl: rp.sourceUrl,
      previewPath: rp.previewPath,
      renderStatus: rp.renderStatus,
      htmlBlobKey: rp.htmlBlobKey,
      screenshotBlobKey: rp.screenshotBlobKey,
      extractedJson: rp.extractedJson as Record<string, unknown> | null,
      errorMessage: rp.errorMessage,
      renderStartedAt: rp.renderStartedAt?.toISOString() ?? null,
      renderFinishedAt: rp.renderFinishedAt?.toISOString() ?? null,
      renderDurationMs: rp.renderDurationMs,
    })),
    widgetConfig: job.widgetConfig
      ? {
          storeName: job.widgetConfig.storeName,
          primaryColor: job.widgetConfig.primaryColor,
          promptContext: job.widgetConfig.promptContext,
          mode: job.widgetConfig.mode,
        }
      : null,
    eventCount: job._count.events,
    lastEvent: job.events[0]
      ? {
          eventName: job.events[0].eventName,
          createdAt: job.events[0].createdAt.toISOString(),
        }
      : null,
  });
}
