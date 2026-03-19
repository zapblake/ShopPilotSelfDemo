import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageAdapter } from "@zapsight/storage";
import { getRenderedPageForPath, rewriteHtml } from "@zapsight/preview";
import { buildWidgetConfig } from "@/lib/widget-config-builder";
import { injectWidget } from "@/lib/widget-injector";

const READY_STATUSES = new Set(["PREVIEW_READY", "RENDER_COMPLETE", "READY"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; path?: string[] }> }
) {
  const { subdomain, path } = await params;
  const previewPath = path ? "/" + path.join("/") : "/";
  const hostname = `${subdomain}.zapsight.us`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://demo.zapsight.us";

  const previewHost = await prisma.previewHost.findUnique({
    where: { hostname },
    include: { previewJob: true },
  });

  // No job found → redirect to homepage with store URL pre-filled
  if (!previewHost || !previewHost.active) {
    const storeUrl = `https://${subdomain.replace(/-/g, "")}.com`;
    return NextResponse.redirect(`${appUrl}/?url=${encodeURIComponent(storeUrl)}`, 302);
  }

  const jobId = previewHost.previewJobId;
  const job = previewHost.previewJob;

  // Job still processing → redirect to the single status page
  if (!job?.status || !READY_STATUSES.has(job.status)) {
    return NextResponse.redirect(`${appUrl}/preview-jobs/${jobId}`, 302);
  }

  // Job ready → try to serve the rendered page
  const storage = getStorageAdapter();
  const result = await getRenderedPageForPath(prisma, storage, jobId, previewPath);

  // No rendered content (renders failed) → redirect to status page
  if (!result) {
    return NextResponse.redirect(`${appUrl}/preview-jobs/${jobId}`, 302);
  }

  const domain = job?.normalizedDomain ?? subdomain;

  let html = rewriteHtml(result.html, {
    previewJobId: jobId,
    originalDomain: domain,
    previewBasePath: "",
    mode: "subdomain",
  });

  const widgetConfig = await buildWidgetConfig(jobId, previewPath);
  if (widgetConfig) {
    html = injectWidget(html, { config: widgetConfig, apiBaseUrl: appUrl });
  }

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
