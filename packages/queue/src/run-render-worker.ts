import { createRenderWorker } from "./workers/render-worker";

const worker = createRenderWorker();

console.log("Render worker started, waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("Shutting down render worker...");
  await worker.close();
  process.exit(0);
});
