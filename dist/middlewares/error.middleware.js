import { AppError } from '../utils/AppError.js';
const handlePrismaError = (err) => {
    if (err.code === 'P2002') {
        const field = err.meta?.target || 'Field';
        return new AppError(`Duplicate value for ${field}. Please use another value.`, 409);
    }
    if (err.code === 'P2025') {
        return new AppError('Record not found in database.', 404);
    }
    return new AppError('Database Error', 500);
};
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);
const handleZodError = (err) => {
    const errors = err.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('. ');
    return new AppError(`Invalid input data: ${errors}`, 400);
};
const handlePayloadTooLarge = () => new AppError('Article content is too large. Try shortening the text or using image URLs instead of pasted images.', 413);
export const globalErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.statusCode = err.statusCode || 500;
    if (err.type === 'entity.too.large' || err.status === 413)
        error = handlePayloadTooLarge();
    if (err.name === 'PrismaClientKnownRequestError')
        error = handlePrismaError(err);
    if (err.name === 'JsonWebTokenError')
        error = handleJWTError();
    if (err.name === 'TokenExpiredError')
        error = handleJWTExpiredError();
    if (err.name === 'ZodError')
        error = handleZodError(err);
    const msg = String(error.message || '');
    const subscriptionQuota = error.statusCode === 403 &&
        /subscribe|subscription|package limit|does not support|upgrade your plan|no active subscription|limit reached|private session|live cohorts|recorded cohorts/i.test(msg);
    const maintenance = error.code === 'MAINTENANCE' || (error.statusCode === 503 && /maintenance/i.test(msg));
    res.status(error.statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error',
        code: maintenance ? 'MAINTENANCE' : subscriptionQuota ? 'SUBSCRIPTION_QUOTA' : err.code || error.code,
        maintenance: maintenance || undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    console.log("error is :", error);
    console.log("error is :", error.message);
};
//# sourceMappingURL=error.middleware.js.map