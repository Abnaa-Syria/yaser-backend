// src/utils/AppError.ts
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // متغير بيعرفنا إن ده إيرور إحنا متوقعينه (زي باسورد غلط) مش إيرور في السيرفر نفسه
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
//# sourceMappingURL=AppError.js.map