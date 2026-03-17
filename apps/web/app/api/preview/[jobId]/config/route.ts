import { NextRequest, NextResponse } from "next/server";
import { buildWidgetConfig } from "@/lib/widget-config-builder";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const path = request.nextUrl.searchParams.get("path") ?? "/";

  const config = await buildWidgetConfig(jobId, path);

  if (!config) {
    return NextResponse.json(
      { success: false, error: { message: "Preview job not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: config });
}
