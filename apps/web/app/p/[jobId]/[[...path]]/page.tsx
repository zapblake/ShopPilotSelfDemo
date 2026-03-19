import { prisma } from "@/lib/prisma";
import { getStorageAdapter } from "@zapsight/storage";
import { getRenderedPageForPath, rewriteHtml } from "@zapsight/preview";
import { buildWidgetConfig } from "@/lib/widget-config-builder";
import { injectWidget } from "@/lib/widget-injector";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PreviewPageProps {
  params: Promise<{ jobId: string; path?: string[] }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { jobId, path } = await params;
  const previewPath = path ? "/" + path.join("/") : "/";

  const storage = getStorageAdapter();
  const result = await getRenderedPageForPath(prisma, storage, jobId, previewPath);

  const MIN_CONTENT_LENGTH = 2000;
  if (!result || result.html.length < MIN_CONTENT_LENGTH) {
    redirect(`/demo/${jobId}`);
  }

  // Look up the job to get the domain for rewriting
  const job = await prisma.previewJob.findUnique({
    where: { id: jobId },
    select: { normalizedDomain: true },
  });

  const rewrittenHtml = rewriteHtml(result.html, {
    previewJobId: jobId,
    originalDomain: job?.normalizedDomain ?? "",
    previewBasePath: `/p/${jobId}`,
    mode: "dev",
    storeName: job?.normalizedDomain,
  });

  // Build widget config and inject widget into the rewritten HTML
  const widgetConfig = await buildWidgetConfig(jobId, previewPath);
  const finalHtml = widgetConfig
    ? injectWidget(rewrittenHtml, {
        config: widgetConfig,
        apiBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      })
    : rewrittenHtml;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: finalHtml }}
      suppressHydrationWarning
    />
  );
}
