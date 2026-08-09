import rateLimit from 'express-rate-limit';
const isDev = process.env.NODE_ENV !== 'production';
function isCertificateDownloadRequest(req) {
    const path = req.originalUrl || req.url || '';
    return /\/certificates\/[^/]+\/download(?:\?|$)/.test(path)
        || /\/certificates\/verify\/[^/]+\/download(?:\?|$)/.test(path);
}
// Strict limiter for login/register/forgot-password only.
// Refresh/logout are mounted without this limiter to avoid lockouts during token rotation.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 100 : 20,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDev && req.ip === '::1',
});
// General limiter for the rest of the API
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 100 : 300,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => (isDev && req.ip === '::1') || isCertificateDownloadRequest(req),
});
//# sourceMappingURL=rateLimit.middleware.js.map