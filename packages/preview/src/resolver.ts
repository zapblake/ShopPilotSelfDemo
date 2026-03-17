export interface PreviewContext {
  previewJobId: string;
  previewPath: string; // normalized path like "/" or "/products/foo"
}

/**
 * Given a host header and pathname, resolve the preview context.
 * Supports two modes:
 * - Subdomain: host matches preview-{jobId}.zapsight.us
 * - Dev: pathname matches /p/{jobId}/...
 */
export function resolvePreviewContext(
  host: string | undefined,
  pathname: string
): PreviewContext | null {
  // Try subdomain mode first
  if (host) {
    const jobId = extractJobIdFromHost(host);
    if (jobId) {
      const previewPath = normalizePath(pathname);
      return { previewJobId: jobId, previewPath };
    }
  }

  // Try dev mode: /p/{jobId}/...
  const devMatch = pathname.match(/^\/p\/([^/]+)(\/.*)?$/);
  if (devMatch) {
    const jobId = devMatch[1];
    const rest = devMatch[2] ?? "/";
    return { previewJobId: jobId, previewPath: normalizePath(rest) };
  }

  return null;
}

/**
 * Check if a host header represents a preview subdomain.
 */
export function isPreviewHost(host: string | undefined): boolean {
  if (!host) return false;
  return extractJobIdFromHost(host) !== null;
}

/**
 * Extract jobId from a preview subdomain host.
 * "preview-abc123.zapsight.us" -> "abc123"
 * "preview-abc123.zapsight.us:3000" -> "abc123"
 */
export function extractJobIdFromHost(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  const match = hostname.match(/^preview-([^.]+)\.zapsight\.us$/);
  return match ? match[1] : null;
}

/**
 * Build a preview URL path for a given page path.
 */
export function buildPreviewPath(
  mode: "dev" | "subdomain",
  jobId: string,
  pagePath: string
): string {
  const normalized = normalizePath(pagePath);
  if (mode === "subdomain") {
    return normalized;
  }
  return `/p/${jobId}${normalized}`;
}

function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  // Ensure leading slash, remove trailing slash
  const p = path.startsWith("/") ? path : "/" + path;
  return p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p;
}
