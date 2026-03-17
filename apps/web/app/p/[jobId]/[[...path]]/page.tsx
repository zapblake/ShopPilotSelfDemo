import { prisma } from "@/lib/prisma";
import { getStorageAdapter } from "@zapsight/storage";
import { getRenderedPageForPath, rewriteHtml } from "@zapsight/preview";
import { buildWidgetConfig } from "@/lib/widget-config-builder";
import { injectWidget } from "@/lib/widget-injector";
import Link from "next/link";

interface PreviewPageProps {
  params: Promise<{ jobId: string; path?: string[] }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { jobId, path } = await params;
  const previewPath = path ? "/" + path.join("/") : "/";

  const storage = getStorageAdapter();
  const result = await getRenderedPageForPath(prisma, storage, jobId, previewPath);

  if (!result) {
    return (
      <html>
        <body>
          <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: "#f9fafb",
          }}>
            <div style={{ textAlign: "center", maxWidth: 400 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e" }}>
                Preview Not Ready
              </h1>
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                This preview page is not available yet. The render may still be in progress.
              </p>
              <Link
                href={`/preview-jobs/${jobId}`}
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  padding: "8px 20px",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                View Job Status
              </Link>
            </div>
          </div>
        </body>
      </html>
    );
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
