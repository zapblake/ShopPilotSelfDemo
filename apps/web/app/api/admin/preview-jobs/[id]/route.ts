import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@zapsight/db";

const prisma = new PrismaClient();

function isAuthed(): boolean {
  // cookies() is sync in Next.js 15 app router
  const cookieStore = cookies() as unknown as { get: (name: string) => { value: string } | undefined };
  return cookieStore.get("admin_auth")?.value === "authenticated";
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthed()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Delete in dependency order (children first)
    await prisma.previewEvent.deleteMany({ where: { previewJobId: id } });
    await prisma.renderedPage.deleteMany({ where: { previewJobId: id } });
    await prisma.discoveredPage.deleteMany({ where: { crawlRun: { previewJobId: id } } });
    await prisma.crawlRun.deleteMany({ where: { previewJobId: id } });
    await prisma.widgetPreviewConfig.deleteMany({ where: { previewJobId: id } });
    await prisma.previewJob.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete job error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 });
  }
}
