import { Worker } from "bullmq";
import pino from "pino";
import { redis } from "../redis";
import type { PreviewJobData } from "../queues/preview-queue";

const logger = pino({ name: "preview-worker" });

export function createPreviewWorker() {
  const worker = new Worker<PreviewJobData>(
    "preview-jobs",
    async (job) => {
      logger.info({ jobId: job.id }, "Processing preview job");

      return {
        status: "READY",
        previewUrl: "https://mock.zapsight.us",
      };
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job?.id }, "Preview job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, "Preview job failed");
  });

  return worker;
}
