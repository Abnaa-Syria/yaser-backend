// src/utils/AppError.ts
export class AppError extends Error {
    constructor(message, statusCode, options) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = options?.code;
        this.details = options?.details;
        Error.captureStackTrace(this, this.constructor);
    }
}
//# sourceMappingURL=AppError.js.map