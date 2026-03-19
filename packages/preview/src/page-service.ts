import type { PrismaClient, RenderedPage } from "@prisma/client";
import type { StorageAdapter } from "@zapsight/storage";
import pino from "pino";

const logger = pino({ name: "preview-page-service" });

export interface PageResult {
  page: RenderedPage;
  html: string;
}

/**
 * Given a previewJobId and a preview path, find the matching RenderedPage
 * from DB, then load its HTML — first from DB column (htmlContent), then
 * falling back to blob storage.
 *
 * Path matching: try exact match on previewPath first, then fallback to homepage ("/").
 */
export async function getRenderedPageForPath(
  prisma: PrismaClient,
  storage: StorageAdapter,
  previewJobId: string,
  path: string
): Promise<PageResult | null> {
  const normalizedPath = path === "" ? "/" : path;

  // Try exact match
  let page = await (prisma.renderedPage as any).findFirst({
    where: {
      previewJobId,
      previewPath: normalizedPath,
      renderStatus: "DONE",
    },
  }) as (RenderedPage & { htmlContent?: string | null }) | null;

  // Fallback: try homepage
  if (!page && normalizedPath !== "/") {
    logger.info(
      { previewJobId, requestedPath: normalizedPath },
      "Exact path not found, falling back to homepage"
    );
    page = await (prisma.renderedPage as any).findFirst({
      where: {
        previewJobId,
        previewPath: "/",
        renderStatus: "DONE",
      },
    }) as (RenderedPage & { htmlContent?: string | null }) | null;
  }

  if (!page) {
    logger.warn({ previewJobId, path: normalizedPath }, "No rendered page found");
    return null;
  }

  // 1. Try in-DB HTML first (works cross-environment without shared storage)
  if (page.htmlContent) {
    logger.info({ previewJobId, path: normalizedPath }, "Serving HTML from DB column");
    return { page, html: page.htmlContent };
  }

  // 2. Fall back to blob storage
  if (!page.htmlBlobKey) {
    logger.warn({ previewJobId, path: normalizedPath }, "No htmlContent or htmlBlobKey");
    return null;
  }

  try {
    const buffer = await storage.download(page.htmlBlobKey);
    const html = buffer.toString("utf-8");
    return { page, html };
  } catch (err) {
    logger.error(
      { previewJobId, htmlBlobKey: page.htmlBlobKey, error: err },
      "Failed to download HTML from storage"
    );
    return null;
  }
}
