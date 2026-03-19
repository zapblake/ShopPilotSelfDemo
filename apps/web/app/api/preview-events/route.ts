import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { previewJobId, eventName, eventPayload, sessionId } = body;

    if (!previewJobId || typeof previewJobId !== "string") {
      return NextResponse.json(
        { success: false, error: { message: "previewJobId is required" } },
        { status: 400 }
      );
    }

    if (!eventName || typeof eventName !== "string") {
      return NextResponse.json(
        { success: false, error: { message: "eventName is required" } },
        { status: 400 }
      );
    }

    const event = await prisma.previewEvent.create({
      data: {
        previewJobId,
        eventName,
        eventPayload: eventPayload ?? {},
        sessionId: sessionId ?? null,
      },
    });

    // Fire-and-forget Telegram notifications for high-signal events
    if (eventName === "widget_opened" || eventName === "cta_clicked") {
      prisma.previewJob
        .findUnique({
          where: { id: previewJobId },
          select: { normalizedDomain: true, email: true },
        })
        .then((job) => {
          if (!job) return;
          if (eventName === "widget_opened") {
            sendTelegramNotification(
              [
                `🔍 <b>Widget Opened</b>`,
                `Someone opened the ZapSight widget on their preview.`,
                `Domain: ${job.normalizedDomain}`,
                `Job: ${previewJobId}`,
              ].join("\n")
            );
          } else if (eventName === "cta_clicked") {
            sendTelegramNotification(
              [
                `🔥 <b>HOT LEAD — CTA Clicked!</b>`,
                `Someone clicked "Book a 15-Min Call" in the preview widget.`,
                `Domain: ${job.normalizedDomain}`,
                `Email: ${job.email || "not provided"}`,
                `Job: ${previewJobId}`,
                `Preview: https://demo.zapsight.us/p/${previewJobId}`,
              ].join("\n")
            );
          }
        })
        .catch(() => {});
    }

    return NextResponse.json(
      { success: true, data: { id: event.id } },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Failed to create event" } },
      { status: 500 }
    );
  }
}
