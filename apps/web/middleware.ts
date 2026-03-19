import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type HostType = "main" | "preview" | "unknown";

function classifyHost(hostname: string): { type: HostType; subdomain?: string } {
  const lowerHost = hostname.split(":")[0].toLowerCase();

  if (
    lowerHost === "demo.zapsight.us" ||
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

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "localhost";
  const { type, subdomain } = classifyHost(host);

  if (type === "preview" && subdomain) {
    const pathname = request.nextUrl.pathname;

    // Skip Next.js internals, API routes, and app pages
    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/preview-jobs/") ||
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/status/") ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    // Pattern 1: preview-{jobId}.zapsight.us → direct rewrite to /p/{jobId}
    const directMatch = subdomain.match(/^preview-(.+)$/);
    if (directMatch) {
      const jobId = directMatch[1];
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/p/${jobId}${pathname === "/" ? "" : pathname}`;
      const response = NextResponse.rewrite(rewriteUrl);
      response.headers.set("x-host-type", "preview");
      response.headers.set("x-preview-subdomain", subdomain);
      response.headers.set("x-preview-job-id", jobId);
      return response;
    }

    // Pattern 2: {domain-slug}.zapsight.us → lookup by hostname in DB via /p/by-host/
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/p/by-host/${subdomain}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-host-type", "preview");
    response.headers.set("x-preview-subdomain", subdomain);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-host-type", type);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
