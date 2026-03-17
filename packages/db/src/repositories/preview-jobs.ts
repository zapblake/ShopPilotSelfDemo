import { prisma } from "../index";
import type { JobStatus } from "@prisma/client";

export const previewJobsRepository = {
  async findById(id: string) {
    return prisma.previewJob.findUnique({
      where: { id },
      include: {
        crawlRuns: true,
        renderedPages: true,
        previewHosts: true,
        widgetConfig: true,
        events: true,
      },
    });
  },

  async create(data: {
    submittedUrl: string;
    normalizedDomain: string;
    email?: string;
  }) {
    return prisma.previewJob.create({
      data,
    });
  },

  async updateStatus(id: string, status: JobStatus, error?: { code: string; message: string }) {
    return prisma.previewJob.update({
      where: { id },
      data: {
        status,
        errorCode: error?.code,
        errorMessage: error?.message,
        completedAt: status === "READY" || status === "FAILED" ? new Date() : undefined,
      },
    });
  },
};
