// src/utils/AppError.ts

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // متغير بيعرفنا إن ده إيرور إحنا متوقعينه (زي باسورد غلط) مش إيرور في السيرفر نفسه
    this.isOperational = true; 

    Error.captureStackTrace(this, this.constructor);
  }
}