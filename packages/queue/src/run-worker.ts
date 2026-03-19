import { createPreviewWorker } from "./workers/preview-worker";
import { createRenderWorker } from "./workers/render-worker";

const previewWorker = createPreviewWorker();
const renderWorker = createRenderWorker();

console.log("Preview + render workers started, waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await previewWorker.close();
  await renderWorker.close();
  process.exit(0);
});
