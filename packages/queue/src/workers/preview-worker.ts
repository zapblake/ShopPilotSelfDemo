import { PrismaClient } from "@prisma/client";
import pino from "pino";
import {
  MockCrawlProvider,
  classifyPages,
  selectRepresentativePages,
} from "@zapsight/crawl";

const logger = pino({ name: "preview-worker" });
const prisma = new PrismaClient();
const provider = new MockCrawlProvider();

let running = false;

async function processNextPreviewJob(): Promise<boolean> {
  // Atomically claim one QUEUED job
  const job = await prisma.previewJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return false;

  // Claim it (optimistic update — if another worker grabs it first, we'll get 0 rows)
  const claimed = await prisma.previewJob.updateMany({
    where: { id: job.id, status: "QUEUED" },
    data: { status: "CRAWLING" },
  });

  if (claimed.count === 0) return false; // another worker got it

  const previewJobId = job.id;
  const submittedUrl = job.submittedUrl;
  const normalizedDomain = job.normalizedDomain;

  logger.info({ previewJobId }, "Processing preview job");

  try {
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
      data: { status: "READY_FOR_RENDER" },
    });

    // 11. Create RenderedPage stubs for selected pages
    const selectedPages = classified.filter((cp) =>
      Object.values(selected).some(
        (s) => s?.normalizedUrl === cp.normalizedUrl
      )
    );

    for (const page of selectedPages) {
      await prisma.renderedPage.create({
        data: {
          previewJobId,
          sourceUrl: page.url,
          previewPath: page.normalizedUrl,
          renderStatus: "PENDING",
        },
      });
    }

    // 12. Mark as ready for render worker to pick up
    await prisma.previewJob.update({
      where: { id: previewJobId },
      data: { status: "READY_FOR_RENDER" },
    });

    logger.info({ previewJobId, renderPageCount: selectedPages.length }, "Preview job completed, render enqueued");
  } catch (err) {
    logger.error({ previewJobId, error: err }, "Preview job failed");

    await prisma.previewJob.update({
      where: { id: previewJobId },
      data: {
        status: "FAILED",
        errorCode: "WORKER_ERROR",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        completedAt: new Date(),
      },
    });
  }

  return true;
}

export function createPreviewWorker() {
  let stopped = false;

  async function poll() {
    while (!stopped) {
      try {
        const didWork = await processNextPreviewJob();
        if (!didWork) {
          // Nothing to do — wait 5s before polling again
          await new Promise((r) => setTimeout(r, 5000));
        }
      } catch (err) {
        logger.error({ error: err }, "Preview poll loop error");
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
