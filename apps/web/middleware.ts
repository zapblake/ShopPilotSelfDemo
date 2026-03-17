import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type HostType = "main" | "preview" | "unknown";

function classifyHost(hostname: string): { type: HostType; subdomain?: string } {
  const lowerHost = hostname.split(":")[0].toLowerCase();

  if (
    lowerHost === "zapsight.us" ||
    lowerHost === "www.zapsight.us" ||
    lowerHost === "localhost" ||
    lowerHost === "127.0.0.1"
  ) {
    return { type: "main" };
  }

  if (lowerHost.endsWith(".zapsight.us")) {
    const subdomain = lowerHost.replace(".zapsight.us", "");
    if (subdomain && !subdomain.includes(".")) {
      return { type: "preview", subdomain };
    }
  }

  return { type: "unknown" };
}

/**
 * Extract jobId from a preview subdomain.
 * "preview-abc123" -> "abc123"
 */
function extractJobIdFromSubdomain(subdomain: string): string | null {
  const match = subdomain.match(/^preview-(.+)$/);
  return match ? match[1] : null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "localhost";
  const { type, subdomain } = classifyHost(host);

  // Preview subdomain rewriting: preview-{jobId}.zapsight.us/* -> /p/{jobId}/*
  if (type === "preview" && subdomain) {
    const jobId = extractJobIdFromSubdomain(subdomain);
    if (jobId) {
      const pathname = request.nextUrl.pathname;
      // Don't rewrite Next.js internals
      if (pathname.startsWith("/_next/") || pathname === "/favicon.ico") {
        return NextResponse.next();
      }

      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/p/${jobId}${pathname === "/" ? "" : pathname}`;

      const response = NextResponse.rewrite(rewriteUrl);
      response.headers.set("x-host-type", "preview");
      response.headers.set("x-preview-subdomain", subdomain);
      response.headers.set("x-preview-job-id", jobId);
      response.headers.set("x-preview-path", pathname);
      return response;
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-host-type", type);

  if (subdomain) {
    response.headers.set("x-preview-subdomain", subdomain);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
