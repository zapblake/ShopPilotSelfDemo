export interface RenderInput {
  url: string;
  jobId: string;
  pageType: string;
}

export interface RenderOutput {
  html: string;
  screenshotBuffer: Buffer;
  metadata: ExtractedMetadata;
  durationMs: number;
}

export interface ExtractedMetadata {
  title: string;
  url: string;
  path: string;
  metaDescription?: string;
  h1?: string;
  pageType: string;
  linkCount: number;
  internalLinks: string[];
}

export interface RendererProvider {
  name: string;
  render(input: RenderInput): Promise<RenderOutput>;
}
