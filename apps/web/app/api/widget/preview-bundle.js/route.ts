import { NextResponse } from "next/server";

export async function GET() {
  const js = `// ZapSight Widget Preview Bundle - placeholder
// Real bundle will be injected inline in Phase 5
// Widget functionality is currently provided via inline script injection
console.log("[ZapSight] Preview bundle loaded");
`;

  return new NextResponse(js, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
