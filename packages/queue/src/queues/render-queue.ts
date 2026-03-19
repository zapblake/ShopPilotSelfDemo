import { Queue } from "bullmq";
import { bullmqConnection } from "../redis";

export interface RenderJobData {
  previewJobId: string;
}

export const renderQueue = new Queue<RenderJobData>("render-jobs", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});
