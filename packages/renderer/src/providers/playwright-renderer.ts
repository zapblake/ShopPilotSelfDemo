import pino from "pino";
import type { RendererProvider, RenderInput, RenderOutput, ExtractedMetadata } from "../types";

const logger = pino({ name: "playwright-renderer" });

export class PlaywrightRendererProvider implements RendererProvider {
  name = "playwright";

  async render(input: RenderInput): Promise<RenderOutput> {
    const start = Date.now();
    logger.info({ url: input.url, jobId: input.jobId }, "Rendering page with Playwright");

    // Dynamic import so the package doesn't fail if playwright isn't installed
    const { chromium } = await import("playwright");

    const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";
    const browser = await chromium.launch({ headless });

    try {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ZapSight/Preview",
      });

      const page = await context.newPage();
      await page.goto(input.url, { waitUntil: "networkidle", timeout: 30_000 });

      const html = await page.content();
      const screenshotBuffer = Buffer.from(await page.screenshot({ type: "png" }));

      const title = await page.title();

      const metaDescription = await page
        .locator('meta[name="description"]')
        .first()
        .getAttribute("content")
        .catch(() => undefined);

      const h1 = await page
        .locator("h1")
        .first()
        .innerText()
        .catch(() => undefined);

      const parsedUrl = new URL(input.url);

      const linkData: { total: number; internal: string[] } = await page.evaluate(
        /* istanbul ignore next -- runs in browser context */
        `(() => {
          const anchors = Array.from(document.querySelectorAll("a[href]"));
          const hrefs = anchors.map(a => a.getAttribute("href") || "");
          const domain = location.hostname;
          const internal = hrefs.filter(h => h.startsWith("/") || h.includes(domain));
          return { total: anchors.length, internal: internal.slice(0, 10) };
        })()`
      );

      const metadata: ExtractedMetadata = {
        title,
        url: input.url,
        path: parsedUrl.pathname,
        metaDescription: metaDescription ?? undefined,
        h1: h1 ?? undefined,
        pageType: input.pageType,
        linkCount: linkData.total,
        internalLinks: linkData.internal,
      };

      await context.close();
      const durationMs = Date.now() - start;

      logger.info({ url: input.url, durationMs }, "Playwright render complete");

      return { html, screenshotBuffer, metadata, durationMs };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ url: input.url, error: message }, "Playwright render failed");
      throw new Error(`Playwright render failed for ${input.url}: ${message}`);
    } finally {
      await browser.close();
    }
  }
}
