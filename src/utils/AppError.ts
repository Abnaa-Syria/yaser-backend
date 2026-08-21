// src/utils/AppError.ts

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: unknown;

  constructor(message: string, statusCode: number, options?: { code?: string; details?: unknown }) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = options?.code;
    this.details = options?.details;

    Error.captureStackTrace(this, this.constructor);
  }
}
