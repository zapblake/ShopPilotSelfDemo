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
 * from DB, then load its HTML from storage.
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
  let page = await prisma.renderedPage.findFirst({
    where: {
      previewJobId,
      previewPath: normalizedPath,
      renderStatus: "DONE",
    },
  });

  // Fallback: try homepage
  if (!page && normalizedPath !== "/") {
    logger.info(
      { previewJobId, requestedPath: normalizedPath },
      "Exact path not found, falling back to homepage"
    );
    page = await prisma.renderedPage.findFirst({
      where: {
        previewJobId,
        previewPath: "/",
        renderStatus: "DONE",
      },
    });
  }

  if (!page || !page.htmlBlobKey) {
    logger.warn({ previewJobId, path: normalizedPath }, "No rendered page found");
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
