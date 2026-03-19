import { Queue } from "bullmq";
import { bullmqConnection } from "../redis";

export interface PreviewJobData {
  previewJobId: string;
  submittedUrl: string;
  normalizedDomain: string;
}

export const previewQueue = new Queue<PreviewJobData>("preview-jobs", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});
