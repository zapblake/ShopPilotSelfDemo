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

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "localhost";
  const { type, subdomain } = classifyHost(host);

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
