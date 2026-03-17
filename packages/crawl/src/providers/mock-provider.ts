import type { CrawlProvider, CrawlInput, CrawlResult, CrawledPage } from "../types";

export class MockCrawlProvider implements CrawlProvider {
  name = "mock";

  async crawl(input: CrawlInput): Promise<CrawlResult> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const domain = input.domain;
    const base = `https://${domain}`;

    const pages: CrawledPage[] = [
      {
        url: `${base}/`,
        normalizedUrl: `${domain}/`,
        title: `${domain} | Home - Furniture and Mattress Store`,
        statusCode: 200,
      },
      {
        url: `${base}/collections/all`,
        normalizedUrl: `${domain}/collections/all`,
        title: `All Products | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/collections/bedroom`,
        normalizedUrl: `${domain}/collections/bedroom`,
        title: `Bedroom Furniture | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/collections/mattresses`,
        normalizedUrl: `${domain}/collections/mattresses`,
        title: `Mattresses | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/products/king-hybrid-mattress`,
        normalizedUrl: `${domain}/products/king-hybrid-mattress`,
        title: `King Hybrid Mattress | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/products/queen-memory-foam`,
        normalizedUrl: `${domain}/products/queen-memory-foam`,
        title: `Queen Memory Foam Mattress | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/products/adjustable-base`,
        normalizedUrl: `${domain}/products/adjustable-base`,
        title: `Adjustable Base | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/pages/about-us`,
        normalizedUrl: `${domain}/pages/about-us`,
        title: `About Us | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/pages/faq`,
        normalizedUrl: `${domain}/pages/faq`,
        title: `FAQ | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/cart`,
        normalizedUrl: `${domain}/cart`,
        title: `Cart | ${domain}`,
        statusCode: 200,
      },
      {
        url: `${base}/account`,
        normalizedUrl: `${domain}/account`,
        title: `Account | ${domain}`,
        statusCode: 200,
      },
    ];

    return {
      pages,
      provider: this.name,
      crawledAt: new Date(),
    };
  }
}
