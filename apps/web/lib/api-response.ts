import { NextResponse } from "next/server";
import { generateRequestId } from "./request-id";

interface SuccessResponse<T> {
  success: true;
  data: T;
  error: null;
  requestId: string;
}

interface ErrorResponse {
  success: false;
  data: null;
  error: { code: string; message: string };
  requestId: string;
}

export function successResponse<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      error: null,
      requestId: generateRequestId(),
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 500
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      data: null,
      error: { code, message },
      requestId: generateRequestId(),
    },
    { status }
  );
}
