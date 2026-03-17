import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import pino from "pino";
import { redis } from "../redis";
import {
  MockCrawlProvider,
  classifyPages,
  selectRepresentativePages,
} from "@zapsight/crawl";
import type { PreviewJobData } from "../queues/preview-queue";

const logger = pino({ name: "preview-worker" });
const prisma = new PrismaClient();
const provider = new MockCrawlProvider();

export function createPreviewWorker() {
  const worker = new Worker<PreviewJobData>(
    "preview-jobs",
    async (job) => {
      const { previewJobId, submittedUrl, normalizedDomain } = job.data;
      logger.info({ previewJobId }, "Processing preview job");

      try {
        // 1. Update status to CRAWLING
        await prisma.previewJob.update({
          where: { id: previewJobId },
          data: { status: "CRAWLING" },
        });

        // 2. Create CrawlRun
        const crawlRun = await prisma.crawlRun.create({
          data: {
            previewJobId,
            provider: provider.name,
            status: "RUNNING",
            startedAt: new Date(),
          },
        });

        // 3. Run crawl
        const crawlResult = await provider.crawl({
          url: submittedUrl,
          domain: normalizedDomain,
          jobId: previewJobId,
        });

        // 4. Update status to CLASSIFYING
        await prisma.previewJob.update({
          where: { id: previewJobId },
          data: { status: "CLASSIFYING" },
        });

        // 5. Update CrawlRun to COMPLETED
        await prisma.crawlRun.update({
          where: { id: crawlRun.id },
          data: {
            status: "COMPLETED",
            finishedAt: new Date(),
            rawResultJson: JSON.parse(JSON.stringify(crawlResult)),
          },
        });

        // 6. Create DiscoveredPage for each crawled page
        for (const page of crawlResult.pages) {
          await prisma.discoveredPage.create({
            data: {
              crawlRunId: crawlRun.id,
              url: page.url,
              normalizedUrl: page.normalizedUrl,
              title: page.title,
              statusCode: page.statusCode,
            },
          });
        }

        // 7. Classify pages
        const classified = classifyPages(crawlResult.pages);

        // 8. Select representative pages
        const selected = selectRepresentativePages(classified);

        // 9. Update DiscoveredPages with classification and selection
        for (const cp of classified) {
          const isSelected = Object.values(selected).some(
            (s) => s?.normalizedUrl === cp.normalizedUrl
          );

          await prisma.discoveredPage.updateMany({
            where: {
              crawlRunId: crawlRun.id,
              normalizedUrl: cp.normalizedUrl,
            },
            data: {
              pageType: cp.pageType.toUpperCase() as
                | "HOMEPAGE"
                | "PRODUCT"
                | "COLLECTION"
                | "INFO"
                | "CART"
                | "ACCOUNT"
                | "OTHER",
              score: cp.score,
              reasoning: cp.reasoning,
              selected: isSelected,
            },
          });
        }

        // 10. Update PreviewJob to READY_FOR_RENDER
        await prisma.previewJob.update({
          where: { id: previewJobId },
          data: {
            status: "READY_FOR_RENDER",
            completedAt: new Date(),
          },
        });

        logger.info({ previewJobId }, "Preview job completed");
      } catch (err) {
        logger.error({ previewJobId, error: err }, "Preview job failed");

        await prisma.previewJob.update({
          where: { id: previewJobId },
          data: {
            status: "FAILED",
            errorCode: "WORKER_ERROR",
            errorMessage:
              err instanceof Error ? err.message : "Unknown error",
            completedAt: new Date(),
          },
        });

        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job?.id }, "Worker job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message },
      "Worker job failed"
    );
  });

  return worker;
}
