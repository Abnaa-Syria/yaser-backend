import { verifyToken } from '../utils/security/jwt.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { prisma } from '../prisma.js';
function headerFingerprint(req) {
    const raw = req.get('x-device-fingerprint') || req.get('X-Device-Fingerprint');
    const fp = String(raw || '').trim();
    return fp.length >= 8 ? fp.slice(0, 191) : undefined;
}
export const protectTrial = catchAsync(async (req, _res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('Trial session required. Start a free trial first.', 401));
    }
    let decoded;
    try {
        decoded = verifyToken({ token });
    }
    catch {
        return next(new AppError('Trial session expired or invalid. Please start again.', 401));
    }
    if (decoded.type !== 'trial' || !decoded.trialId) {
        return next(new AppError('Invalid trial token.', 401));
    }
    const trialId = String(decoded.trialId).trim();
    // Invalid ids must not become unhandled Prisma 500s (blank /trial page).
    if (!/^[0-9a-f-]{36}$/i.test(trialId)) {
        return next(new AppError('Trial session expired or invalid. Please start again.', 401));
    }
    let session;
    try {
        session = await prisma.trialSession.findUnique({
            where: { id: trialId },
        });
    }
    catch {
        return next(new AppError('Trial session expired or invalid. Please start again.', 401));
    }
    if (!session) {
        return next(new AppError('Trial session not found. Please start again.', 401));
    }
    if (session.revokedAt) {
        return next(new AppError('This device trial was stopped by an administrator.', 403));
    }
    if (session.expiresAt.getTime() <= Date.now()) {
        return next(new AppError('Your free trial has ended. Create an account to continue.', 403));
    }
    const fingerprint = headerFingerprint(req);
    if (!fingerprint) {
        return next(new AppError('Device fingerprint required for trial access.', 403));
    }
    if (session.fingerprint && fingerprint !== session.fingerprint) {
        return next(new AppError('Trial session does not match this device.', 403));
    }
    // Touch lastSeenAt without racing other handlers (raw UPDATE avoids MariaDB 1020).
    void prisma
        .$executeRaw `UPDATE trial_sessions SET lastSeenAt = NOW(3) WHERE id = ${session.id}`
        .catch(() => undefined);
    req.trial = {
        trialId: session.id,
        type: 'trial',
        expiresAt: session.expiresAt.toISOString(),
        fingerprint: session.fingerprint,
    };
    next();
});
//# sourceMappingURL=trial.middleware.js.map