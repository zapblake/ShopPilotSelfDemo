import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json(
      { success: true, data: { id: event.id } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Failed to create event" } },
      { status: 500 }
    );
  }
}
