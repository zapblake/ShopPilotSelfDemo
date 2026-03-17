import { prisma } from "@/lib/prisma";

export interface PageContext {
  url: string;
  path: string;
  pageType: string;
  title: string;
  metaDescription?: string;
  h1?: string;
}

export interface SampleProduct {
  title: string;
  url: string;
  pageType: string;
}

export interface StoreContext {
  storeName: string;
  domain: string;
  productTypes: string[];
  sampleProducts: SampleProduct[];
}

export interface DemoFlags {
  isDemo: true;
  showDemoBadge: boolean;
  allowConversation: boolean;
  greetingOverride?: string;
}

export interface WidgetPreviewConfig {
  previewJobId: string;
  normalizedDomain: string;
  storeName: string;
  primaryColor: string;
  mode: "preview" | "production";
  pageContext: PageContext;
  storeContext: StoreContext;
  promptContext: string;
  demoFlags: DemoFlags;
}

export async function buildWidgetConfig(
  previewJobId: string,
  currentPath: string
): Promise<WidgetPreviewConfig | null> {
  const job = await prisma.previewJob.findUnique({
    where: { id: previewJobId },
    include: {
      crawlRuns: {
        include: { discoveredPages: true },
      },
      renderedPages: true,
      widgetConfig: true,
    },
  });

  if (!job) return null;

  // Build pageContext from the RenderedPage matching currentPath
  const renderedPage =
    job.renderedPages.find((rp) => rp.previewPath === currentPath) ??
    job.renderedPages.find((rp) => rp.previewPath === "/" || rp.previewPath === "") ??
    job.renderedPages[0];

  const extracted = (renderedPage?.extractedJson as Record<string, string> | null) ?? {};

  const pageContext: PageContext = {
    url: renderedPage?.sourceUrl ?? `https://${job.normalizedDomain}${currentPath}`,
    path: currentPath,
    pageType: extracted.pageType ?? "unknown",
    title: extracted.title ?? job.normalizedDomain,
    metaDescription: extracted.metaDescription,
    h1: extracted.h1,
  };

  // Build storeContext from discovered pages
  const discoveredPages = job.crawlRuns.flatMap((cr) => cr.discoveredPages);

  const storeName =
    job.widgetConfig?.storeName ??
    job.normalizedDomain
      .replace(/\.\w+$/, "")
      .replace(/(^|\.)(\w)/g, (_m, _p, c: string) => ` ${c.toUpperCase()}`)
      .trim();

  const productTypes = [
    ...new Set(
      discoveredPages
        .map((p) => p.pageTypeCandidate)
        .filter((t): t is string => !!t)
    ),
  ];

  const sampleProducts = discoveredPages
    .filter(
      (p) =>
        p.pageType === "PRODUCT" ||
        p.pageTypeCandidate?.toLowerCase().includes("product")
    )
    .slice(0, 3)
    .map((p) => ({
      title: p.title ?? p.url,
      url: p.url,
      pageType: p.pageTypeCandidate ?? "product",
    }));

  const storeContext: StoreContext = {
    storeName,
    domain: job.normalizedDomain,
    productTypes,
    sampleProducts,
  };

  const promptContext = `You are a helpful AI shopping assistant for ${storeName}. You are previewing their website at ${job.normalizedDomain}. The customer is viewing ${pageContext.pageType} page: ${pageContext.title}. Help them find products and answer questions about the store.`;

  const demoFlags: DemoFlags = {
    isDemo: true,
    showDemoBadge: true,
    allowConversation: true,
  };

  const primaryColor = job.widgetConfig?.primaryColor ?? "#1a1a2e";

  // Upsert WidgetPreviewConfig in DB
  await prisma.widgetPreviewConfig.upsert({
    where: { previewJobId },
    create: {
      previewJobId,
      storeName,
      primaryColor,
      promptContext,
      mode: "preview",
      extractedCatalogJson: { productTypes, sampleProducts },
    },
    update: {
      storeName,
      primaryColor,
      promptContext,
      extractedCatalogJson: { productTypes, sampleProducts },
    },
  });

  return {
    previewJobId,
    normalizedDomain: job.normalizedDomain,
    storeName,
    primaryColor,
    mode: "preview",
    pageContext,
    storeContext,
    promptContext,
    demoFlags,
  };
}
