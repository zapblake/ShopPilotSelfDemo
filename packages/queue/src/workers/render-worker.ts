import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import pino from "pino";
import { redis } from "../redis";
import { MockRendererProvider, PlaywrightRendererProvider } from "@zapsight/renderer";
import type { RendererProvider } from "@zapsight/renderer";
import { getStorageAdapter } from "@zapsight/storage";
import type { RenderJobData } from "../queues/render-queue";

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

export function createRenderWorker() {
  const worker = new Worker<RenderJobData>(
    "render-jobs",
    async (job) => {
      const { previewJobId } = job.data;
      logger.info({ previewJobId }, "Processing render job");

      try {
        // 1. Find pending RenderedPage records
        const pendingPages = await prisma.renderedPage.findMany({
          where: { previewJobId, renderStatus: "PENDING" },
        });

        if (pendingPages.length === 0) {
          logger.warn({ previewJobId }, "No pending pages to render");
          return;
        }

        // 2. Update job status to RENDERING
        await prisma.previewJob.update({
          where: { id: previewJobId },
          data: { status: "RENDERING" },
        });

        // 3. Render each page
        for (const renderedPage of pendingPages) {
          try {
            // Mark as RENDERING
            await prisma.renderedPage.update({
              where: { id: renderedPage.id },
              data: {
                renderStatus: "RENDERING",
                renderStartedAt: new Date(),
              },
            });

            // Render the page
            const result = await renderer.render({
              url: renderedPage.sourceUrl,
              jobId: previewJobId,
              pageType: renderedPage.previewPath,
            });

            // Upload HTML to storage
            const htmlKey = `jobs/${previewJobId}/pages/${renderedPage.id}/index.html`;
            await storage.upload(htmlKey, Buffer.from(result.html, "utf-8"), "text/html");

            // Upload screenshot to storage
            const screenshotKey = `jobs/${previewJobId}/pages/${renderedPage.id}/screenshot.png`;
            await storage.upload(screenshotKey, result.screenshotBuffer, "image/png");

            // Update RenderedPage as DONE
            await prisma.renderedPage.update({
              where: { id: renderedPage.id },
              data: {
                renderStatus: "DONE",
                htmlBlobKey: htmlKey,
                screenshotBlobKey: screenshotKey,
                extractedJson: JSON.parse(JSON.stringify(result.metadata)),
                renderFinishedAt: new Date(),
                renderDurationMs: result.durationMs,
              },
            });

            logger.info(
              { pageId: renderedPage.id, url: renderedPage.sourceUrl, durationMs: result.durationMs },
              "Page rendered successfully"
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(
              { pageId: renderedPage.id, url: renderedPage.sourceUrl, error: message },
              "Failed to render page"
            );

            await prisma.renderedPage.update({
              where: { id: renderedPage.id },
              data: {
                renderStatus: "FAILED",
                errorMessage: message,
                renderFinishedAt: new Date(),
              },
            });
          }
        }

        // 4. Update job status to RENDER_COMPLETE
        await prisma.previewJob.update({
          where: { id: previewJobId },
          data: {
            status: "RENDER_COMPLETE",
            completedAt: new Date(),
          },
        });

        logger.info({ previewJobId }, "Render job completed");
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

        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job?.id }, "Render worker job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, "Render worker job failed");
  });

  return worker;
}
