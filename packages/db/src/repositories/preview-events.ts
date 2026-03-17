import { prisma } from "../index";
import type { Prisma } from "@prisma/client";

export const previewEventsRepository = {
  async create(data: {
    previewJobId: string;
    eventName: string;
    sessionId?: string;
    eventPayload?: Prisma.InputJsonValue;
  }) {
    return prisma.previewEvent.create({
      data,
    });
  },
};
