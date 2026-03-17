import { prisma } from "@/lib/prisma";
import { getStorageAdapter } from "@zapsight/storage";
import { getRenderedPageForPath, rewriteHtml } from "@zapsight/preview";
import { buildWidgetConfig } from "@/lib/widget-config-builder";
import { injectWidget } from "@/lib/widget-injector";
import Link from "next/link";

interface ByHostPageProps {
  params: Promise<{ subdomain: string; path?: string[] }>;
}

export default async function ByHostPreviewPage({ params }: ByHostPageProps) {
  const { subdomain, path } = await params;
  const previewPath = path ? "/" + path.join("/") : "/";
  const hostname = `${subdomain}.zapsight.us`;

  // Look up the PreviewHost by hostname
  const previewHost = await prisma.previewHost.findUnique({
    where: { hostname },
    include: { previewJob: true },
  });

  if (!previewHost || !previewHost.active) {
    return (
      <html>
        <body>
          <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "sans-serif", background: "#f9fafb",
          }}>
            <div style={{ textAlign: "center", maxWidth: 400 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e" }}>Preview Not Found</h1>
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                No preview found for <strong>{hostname}</strong>.
              </p>
              <Link href="/" style={{
                display: "inline-block", marginTop: 16, padding: "8px 20px",
                background: "#2563eb", color: "#fff", borderRadius: 6,
                textDecoration: "none", fontSize: 14,
              }}>
                Create a Preview
              </Link>
            </div>
          </div>
        </body>
      </html>
    );
  }

  const jobId = previewHost.previewJobId;
  const storage = getStorageAdapter();
  const result = await getRenderedPageForPath(prisma, storage, jobId, previewPath);

  if (!result) {
    return (
      <html>
        <body>
          <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "sans-serif", background: "#f9fafb",
          }}>
            <div style={{ textAlign: "center", maxWidth: 400 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e" }}>Preview Not Ready</h1>
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                This preview is still being prepared.
              </p>
              <Link href={`/preview-jobs/${jobId}`} style={{
                display: "inline-block", marginTop: 16, padding: "8px 20px",
                background: "#2563eb", color: "#fff", borderRadius: 6,
                textDecoration: "none", fontSize: 14,
              }}>
                View Job Status
              </Link>
            </div>
          </div>
        </body>
      </html>
    );
  }

  const job = result.page.previewJob ?? previewHost.previewJob;
  const domain = job?.normalizedDomain ?? subdomain;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zapsight.us";

  let html = rewriteHtml(result.html, {
    previewJobId: jobId,
    originalDomain: domain,
    previewBasePath: "",
    mode: "subdomain",
  });

  const widgetConfig = await buildWidgetConfig(prisma, jobId, previewPath);
  if (widgetConfig) {
    html = injectWidget(html, { config: widgetConfig, apiBaseUrl: appUrl });
  }

  return (
    <html>
      <body dangerouslySetInnerHTML={{ __html: html }} />
    </html>
  );
}
