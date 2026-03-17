import pino from "pino";
import type { RendererProvider, RenderInput, RenderOutput, ExtractedMetadata } from "../types";

const logger = pino({ name: "mock-renderer" });

// 1x1 transparent PNG
const TRANSPARENT_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

export class MockRendererProvider implements RendererProvider {
  name = "mock";

  async render(input: RenderInput): Promise<RenderOutput> {
    const start = Date.now();
    logger.info({ url: input.url, jobId: input.jobId }, "Mock rendering page");

    // Artificial delay 100-300ms
    const delay = 100 + Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const parsedUrl = new URL(input.url);
    const path = parsedUrl.pathname;
    const domain = parsedUrl.hostname;
    const pageName = path === "/" ? "Home" : path.split("/").filter(Boolean).pop() ?? "Page";
    const titleCase = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, " ");

    const internalPaths = [
      "/",
      "/products",
      "/collections",
      "/about",
      "/contact",
    ];
    const internalLinks = internalPaths.filter((p) => p !== path).slice(0, 4);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Welcome to ${titleCase} - ${domain}">
  <title>${titleCase} | ${domain}</title>
</head>
<body>
  <header>
    <nav>
      ${internalLinks.map((l) => `<a href="${l}">${l === "/" ? "Home" : l.slice(1)}</a>`).join("\n      ")}
    </nav>
  </header>
  <main>
    <h1>${titleCase}</h1>
    <p>This is the ${titleCase.toLowerCase()} page for ${domain}.</p>
    <p>Browse our selection of products and find exactly what you need.</p>
    <p>Contact us for more information about our services.</p>
  </main>
  <footer>
    <a href="/privacy">Privacy Policy</a>
  </footer>
</body>
</html>`;

    const allLinks = [...internalLinks, "/privacy"];

    const metadata: ExtractedMetadata = {
      title: `${titleCase} | ${domain}`,
      url: input.url,
      path,
      metaDescription: `Welcome to ${titleCase} - ${domain}`,
      h1: titleCase,
      pageType: input.pageType,
      linkCount: allLinks.length,
      internalLinks: allLinks,
    };

    const screenshotBuffer = Buffer.from(TRANSPARENT_PNG_BASE64, "base64");
    const durationMs = Date.now() - start;

    logger.info({ url: input.url, durationMs }, "Mock render complete");

    return { html, screenshotBuffer, metadata, durationMs };
  }
}
