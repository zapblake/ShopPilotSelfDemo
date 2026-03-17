import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing secret", 401);
  }

  const [
    totalSubmissions,
    demosActive,
    ctaClicks,
    leadsCaptured,
    funnelCounts,
    eventBreakdown,
    recentEvents,
  ] = await Promise.all([
    prisma.previewJob.count(),
    prisma.previewJob.count({
      where: { status: { in: ["PREVIEW_READY", "RENDER_COMPLETE", "READY"] } },
    }),
    prisma.previewEvent.count({
      where: { eventName: "cta_clicked" },
    }),
    prisma.previewJob.count({
      where: { email: { not: null } },
    }),
    prisma.previewJob.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.previewEvent.groupBy({
      by: ["eventName"],
      _count: { _all: true },
      orderBy: { _count: { eventName: "desc" } },
    }),
    prisma.previewEvent.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        previewJob: { select: { normalizedDomain: true } },
      },
    }),
  ]);

  const funnelMap: Record<string, number> = {};
  for (const row of funnelCounts) {
    funnelMap[row.status] = row._count._all;
  }

  return successResponse({
    totalSubmissions,
    demosActive,
    ctaClicks,
    leadsCaptured,
    funnelCounts: {
      PENDING: funnelMap.PENDING ?? 0,
      QUEUED: funnelMap.QUEUED ?? 0,
      CRAWLING: funnelMap.CRAWLING ?? 0,
      READY_FOR_RENDER: funnelMap.READY_FOR_RENDER ?? 0,
      RENDERING: funnelMap.RENDERING ?? 0,
      RENDER_COMPLETE: funnelMap.RENDER_COMPLETE ?? 0,
      PREVIEW_READY: funnelMap.PREVIEW_READY ?? 0,
      READY: funnelMap.READY ?? 0,
      FAILED: funnelMap.FAILED ?? 0,
    },
    eventBreakdown: eventBreakdown.map((row) => ({
      eventName: row.eventName,
      count: row._count._all,
    })),
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      eventName: e.eventName,
      previewJobId: e.previewJobId,
      domain: e.previewJob.normalizedDomain,
      eventPayload: e.eventPayload,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
