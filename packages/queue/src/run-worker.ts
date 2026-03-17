import { createPreviewWorker } from "./workers/preview-worker";

const worker = createPreviewWorker();

console.log("Preview worker started, waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});
