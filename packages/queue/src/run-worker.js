const { Worker } = require("bullmq");
const { Pool } = require("pg");
const IORedis = require("ioredis");

// Raw PG pool — no Prisma, no generate needed
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required");
  process.exit(1);
}

const connection = new IORedis.default
  ? new IORedis.default(REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const STATUSES = [
  "CRAWLING",
  "CLASSIFYING",
  "READY_FOR_RENDER",
  "RENDERING",
  "PREVIEW_READY",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setStatus(id, status, extra = {}) {
  const sets = ['status = $2', 'updated_at = NOW()'];
  const vals = [id, status];
  let i = 3;
  if (extra.errorCode) { sets.push(`error_code = $${i++}`); vals.push(extra.errorCode); }
  if (extra.errorMessage) { sets.push(`error_message = $${i++}`); vals.push(extra.errorMessage); }
  if (extra.completedAt) { sets.push(`completed_at = NOW()`); }
  await pool.query(
    `UPDATE "PreviewJob" SET ${sets.join(', ')} WHERE id = $1`,
    vals
  );
  console.log(`[${id.slice(0, 8)}] → ${status}`);
}

const worker = new Worker(
  "preview-jobs",
  async (job) => {
    const { previewJobId } = job.data;
    console.log(`Processing job ${previewJobId}`);

    try {
      for (const status of STATUSES) {
        await setStatus(previewJobId, status);
        await sleep(1500 + Math.random() * 1000);
      }
      await pool.query(
        `UPDATE "PreviewJob" SET completed_at = NOW() WHERE id = $1`,
        [previewJobId]
      );
      console.log(`Job ${previewJobId} complete`);
    } catch (err) {
      console.error(`Job ${previewJobId} failed:`, err.message);
      await setStatus(previewJobId, "FAILED", {
        errorCode: "WORKER_ERROR",
        errorMessage: err.message,
        completedAt: true,
      }).catch(() => {});
      throw err;
    }
  },
  { connection, concurrency: 5 }
);

worker.on("completed", (job) => console.log(`Done: ${job?.id}`));
worker.on("failed", (job, err) => console.error(`Failed: ${job?.id}`, err.message));

console.log("Preview worker started, waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await worker.close();
  await pool.end();
  process.exit(0);
});
