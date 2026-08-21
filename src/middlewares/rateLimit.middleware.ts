import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function isCertificateDownloadRequest(req: { originalUrl?: string; url?: string }) {
  const path = req.originalUrl || req.url || '';
  return (
    /\/certificates\/[^/]+\/download(?:\?|$)/.test(path) ||
    /\/certificates\/verify\/[^/]+\/download(?:\?|$)/.test(path)
  );
}

function isHealthOrPublicSettings(req: { originalUrl?: string; url?: string; method?: string }) {
  const path = req.originalUrl || req.url || '';
  if (/\/api\/health(?:\?|$)/.test(path)) return true;
  // Site settings are polled by Header/Footer on every public page load.
  if ((req.method || 'GET').toUpperCase() === 'GET' && /\/public\/settings(?:\?|$)/.test(path)) return true;
  return false;
}

// Strict limiter for login/register/forgot-password only.
// Refresh/logout are mounted without this limiter to avoid lockouts during token rotation.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Was 20 — too tight for shared office IPs / retries after device-limit prompts.
  max: envInt('RATE_LIMIT_AUTH_MAX', isDev ? 200 : 60),
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
  // Was 300 — SPA admin/student dashboards easily exceed that with parallel React Query calls.
  max: envInt('RATE_LIMIT_API_MAX', isDev ? 5000 : 2000),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    (isDev && req.ip === '::1') || isCertificateDownloadRequest(req) || isHealthOrPublicSettings(req),
});
