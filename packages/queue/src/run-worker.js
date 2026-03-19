const { Worker } = require("bullmq");
const { PrismaClient } = require("@prisma/client");
const IORedis = require("ioredis");

const prisma = new PrismaClient();

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required");
  process.exit(1);
}

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const STATUS_PIPELINE = [
  "QUEUED",
  "CRAWLING",
  "CLASSIFYING",
  "READY_FOR_RENDER",
  "RENDERING",
  "RENDER_COMPLETE",
  "PREVIEW_READY",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processJob(job) {
  const { jobId } = job.data;
  console.log(`[worker] Processing job ${job.id} (previewJobId=${jobId})`);

  const previewJob = await prisma.previewJob.findUnique({ where: { id: jobId } });
  if (!previewJob) {
    console.error(`[worker] PreviewJob ${jobId} not found — skipping`);
    return;
  }

  const currentIdx = STATUS_PIPELINE.indexOf(previewJob.status);
  const startIdx = currentIdx >= 0 ? currentIdx + 1 : 1; // start after current status

  for (let i = startIdx; i < STATUS_PIPELINE.length; i++) {
    const status = STATUS_PIPELINE[i];
    const delayMs = 1000 + Math.random() * 1000; // 1-2s
    console.log(`[worker] job=${jobId} waiting ${Math.round(delayMs)}ms before → ${status}`);
    await sleep(delayMs);

    await prisma.previewJob.update({
      where: { id: jobId },
      data: { status },
    });
    console.log(`[worker] job=${jobId} status → ${status}`);

    await job.updateProgress(Math.round(((i + 1) / STATUS_PIPELINE.length) * 100));
  }

  console.log(`[worker] job=${jobId} complete ✓`);
}

const worker = new Worker("preview-jobs", processJob, {
  connection,
  concurrency: 5,
});

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err.message);
});

console.log("[worker] Listening on queue 'preview-jobs'…");

// Graceful shutdown
async function shutdown() {
  console.log("[worker] Shutting down…");
  await worker.close();
  await prisma.$disconnect();
  connection.disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
