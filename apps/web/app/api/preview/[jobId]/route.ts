import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await prisma.previewJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      normalizedDomain: true,
      renderedPages: {
        select: {
          id: true,
          sourceUrl: true,
          previewPath: true,
          renderStatus: true,
        },
      },
      previewHosts: {
        where: { active: true },
        select: {
          hostname: true,
          previewBaseUrl: true,
        },
        take: 1,
      },
    },
  });

  if (!job) {
    return NextResponse.json(
      { success: false, error: { message: "Job not found" } },
      { status: 404 }
    );
  }

  const previewMode = process.env.PREVIEW_MODE ?? "dev";
  const baseUrl = process.env.PREVIEW_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const previewUrl =
    previewMode === "subdomain" && job.previewHosts[0]
      ? job.previewHosts[0].previewBaseUrl
      : `${baseUrl}/p/${job.id}`;

  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      domain: job.normalizedDomain,
      previewUrl,
      previewBaseUrl: job.previewHosts[0]?.previewBaseUrl ?? null,
      pages: job.renderedPages.map((p) => ({
        id: p.id,
        sourceUrl: p.sourceUrl,
        previewPath: p.previewPath,
        renderStatus: p.renderStatus,
      })),
    },
  });
}
