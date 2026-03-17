import type { CrawledPage, ClassifiedPage, PageType } from "./types";

export function classifyPages(pages: CrawledPage[]): ClassifiedPage[] {
  return pages.map((page) => {
    const path = new URL(page.url).pathname;
    let pageType: PageType;
    let score: number;
    let reasoning: string;

    if (path === "/") {
      pageType = "homepage";
      score = 1.0;
      reasoning = "Root path";
    } else if (path.startsWith("/products/")) {
      pageType = "product";
      score = 0.95;
      reasoning = "Product path pattern";
    } else if (path.startsWith("/collections/")) {
      pageType = "collection";
      score = 0.95;
      reasoning = "Collection path pattern";
    } else if (path.startsWith("/pages/")) {
      pageType = "info";
      score = 0.9;
      reasoning = "Pages path pattern";
    } else if (path === "/cart") {
      pageType = "cart";
      score = 1.0;
      reasoning = "Cart path";
    } else if (path === "/account") {
      pageType = "account";
      score = 0.9;
      reasoning = "Account path";
    } else {
      pageType = "other";
      score = 0.5;
      reasoning = "No matching pattern";
    }

    return { ...page, pageType, score, reasoning };
  });
}
