export interface CrawledPage {
  url: string;
  normalizedUrl: string;
  title: string;
  statusCode: number;
  headings?: string[];
  metadata?: Record<string, string>;
}

export interface CrawlInput {
  url: string;
  domain: string;
  jobId: string;
}

export interface CrawlResult {
  pages: CrawledPage[];
  provider: string;
  crawledAt: Date;
}

export interface CrawlProvider {
  name: string;
  crawl(input: CrawlInput): Promise<CrawlResult>;
}

export type PageType =
  | "homepage"
  | "product"
  | "collection"
  | "info"
  | "cart"
  | "account"
  | "other";

export interface ClassifiedPage extends CrawledPage {
  pageType: PageType;
  score: number;
  reasoning: string;
}

export interface SelectedPages {
  homepage: ClassifiedPage | null;
  product: ClassifiedPage | null;
  collection: ClassifiedPage | null;
  info: ClassifiedPage | null;
}
