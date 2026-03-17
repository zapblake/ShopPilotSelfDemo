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

export interface PageContext {
  url: string;
  path: string;
  pageType: string;
  title: string;
  metaDescription?: string;
  h1?: string;
}

export interface StoreContext {
  storeName: string;
  domain: string;
  productTypes: string[];
  sampleProducts: SampleProduct[];
}

export interface SampleProduct {
  title: string;
  url: string;
  pageType: string;
}

export interface DemoFlags {
  isDemo: true;
  showDemoBadge: boolean;
  allowConversation: boolean;
  greetingOverride?: string;
}
