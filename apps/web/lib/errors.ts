export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }

  static validation(message: string) {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400);
  }

  static notFound(message: string) {
    return new AppError(ErrorCodes.NOT_FOUND, message, 404);
  }

  static internal(message: string) {
    return new AppError(ErrorCodes.INTERNAL_ERROR, message, 500);
  }

  static unauthorized(message: string) {
    return new AppError(ErrorCodes.UNAUTHORIZED, message, 401);
  }
}
