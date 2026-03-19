import { PrismaClient } from "@prisma/client";
import pino from "pino";
import { MockRendererProvider, PlaywrightRendererProvider } from "@zapsight/renderer";
import type { RendererProvider } from "@zapsight/renderer";
import { getStorageAdapter } from "@zapsight/storage";

const logger = pino({ name: "render-worker" });
const prisma = new PrismaClient();
const storage = getStorageAdapter();

function createRenderer(): RendererProvider {
  const provider = process.env.RENDERER_PROVIDER ?? "mock";
  if (provider === "playwright") {
    return new PlaywrightRendererProvider();
  }
  return new MockRendererProvider();
}

const renderer = createRenderer();

async function processNextRenderJob(): Promise<boolean> {
  // Pick up any job in READY_FOR_RENDER status
  const job = await prisma.previewJob.findFirst({
    where: { status: "READY_FOR_RENDER" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return false;

  // Claim it
  const claimed = await prisma.previewJob.updateMany({
    where: { id: job.id, status: "READY_FOR_RENDER" },
    data: { status: "RENDERING" },
  });

  if (claimed.count === 0) return false;

  const previewJobId = job.id;
  logger.info({ previewJobId }, "Processing render job");

  try {
    // 1. Find pending RenderedPage records
    const pendingPages = await prisma.renderedPage.findMany({
      where: { previewJobId, renderStatus: "PENDING" },
    });

    if (pendingPages.length === 0) {
      logger.warn({ previewJobId }, "No pending pages to render");
      // Still mark as ready
      await prisma.previewJob.update({
        where: { id: previewJobId },
        data: { status: "PREVIEW_READY", completedAt: new Date() },
      });
      return true;
    }

    // 2. Render each page
    for (const renderedPage of pendingPages) {
      try {
        await prisma.renderedPage.update({
          where: { id: renderedPage.id },
          data: { renderStatus: "RENDERING", renderStartedAt: new Date() },
        });

        const result = await renderer.render({
          url: renderedPage.sourceUrl,
          jobId: previewJobId,
          pageType: renderedPage.previewPath,
        });

        const htmlKey = `jobs/${previewJobId}/pages/${renderedPage.id}/index.html`;
        const screenshotKey = `jobs/${previewJobId}/pages/${renderedPage.id}/screenshot.png`;

        try {
          await storage.upload(htmlKey, Buffer.from(result.html, "utf-8"), "text/html");
        } catch {
          logger.warn({ pageId: renderedPage.id }, "Storage upload failed (non-fatal)");
        }

        try {
          await storage.upload(screenshotKey, result.screenshotBuffer, "image/png");
        } catch { /* non-fatal */ }

        // Parse URL for previewPath
        let previewPath = "/";
        try {
          const u = new URL(renderedPage.sourceUrl);
          previewPath = u.pathname || "/";
        } catch { /* keep default */ }

        await (prisma.renderedPage.update as any)({
          where: { id: renderedPage.id },
          data: {
            renderStatus: "DONE",
            htmlBlobKey: htmlKey,
            screenshotBlobKey: screenshotKey,
            htmlContent: result.html,
            extractedJson: JSON.parse(JSON.stringify(result.metadata)),
            renderFinishedAt: new Date(),
            renderDurationMs: result.durationMs,
            previewPath,
          },
        });

        logger.info({ pageId: renderedPage.id, url: renderedPage.sourceUrl, durationMs: result.durationMs }, "Page rendered successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ pageId: renderedPage.id, url: renderedPage.sourceUrl, error: message }, "Failed to render page");

        await prisma.renderedPage.update({
          where: { id: renderedPage.id },
          data: { renderStatus: "FAILED", errorMessage: message, renderFinishedAt: new Date() },
        });
      }
    }

    // 3. Create PreviewHost records
    const primaryHostname = `preview-${previewJobId}.zapsight.us`;
    await prisma.previewHost.upsert({
      where: { hostname: primaryHostname },
      create: { previewJobId, hostname: primaryHostname, active: true, jobStatus: "PREVIEW_READY", previewBaseUrl: `https://${primaryHostname}` },
      update: { active: true, jobStatus: "PREVIEW_READY", previewBaseUrl: `https://${primaryHostname}` },
    });

    if (job.normalizedDomain) {
      const domainSlug = job.normalizedDomain
        .replace(/\.(myshopify\.com|com|net|org|io|co)$/, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      const friendlyHostname = `${domainSlug}.zapsight.us`;
      if (friendlyHostname !== primaryHostname) {
        await prisma.previewHost.upsert({
          where: { hostname: friendlyHostname },
          create: { previewJobId, hostname: friendlyHostname, active: true, jobStatus: "PREVIEW_READY", previewBaseUrl: `https://${friendlyHostname}` },
          update: { active: true, jobStatus: "PREVIEW_READY", previewBaseUrl: `https://${friendlyHostname}` },
        });
      }
    }

    // 4. Mark job complete
    await prisma.previewJob.update({
      where: { id: previewJobId },
      data: { status: "PREVIEW_READY", completedAt: new Date() },
    });

    logger.info({ previewJobId }, "Render job completed, preview ready");
  } catch (err) {
    logger.error({ previewJobId, error: err }, "Render job failed fatally");

    await prisma.previewJob.update({
      where: { id: previewJobId },
      data: {
        status: "FAILED",
        errorCode: "RENDER_ERROR",
        errorMessage: err instanceof Error ? err.message : "Unknown render error",
        completedAt: new Date(),
      },
    });
  }

  return true;
}

export function createRenderWorker() {
  let stopped = false;

  async function poll() {
    while (!stopped) {
      try {
        const didWork = await processNextRenderJob();
        if (!didWork) {
          await new Promise((r) => setTimeout(r, 5000));
        }
      } catch (err) {
        logger.error({ error: err }, "Render poll loop error");
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  poll();

  return {
    close: async () => {
      stopped = true;
    },
  };
}
