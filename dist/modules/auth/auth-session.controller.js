import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';
import { requestOtp, verifyOtp } from './otp.service.js';
import { touchSessionHeartbeat } from '../../services/session.service.js';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
export const requestOtpCode = catchAsync(async (req, res) => {
    const result = await requestOtp({
        userId: req.user.id,
        purpose: req.body.purpose,
        ipAddress: req.ip,
    });
    successResponse({ res, data: result });
});
export const verifyOtpCode = catchAsync(async (req, res) => {
    const result = await verifyOtp({
        userId: req.user.id,
        purpose: req.body.purpose,
        code: req.body.code,
    });
    successResponse({ res, data: result, message: 'OTP verified' });
});
export const heartbeat = catchAsync(async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        throw new AppError('Refresh token required for heartbeat', 400);
    }
    const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        select: { sessionId: true },
    });
    if (!stored) {
        throw new AppError('Invalid session', 401);
    }
    await touchSessionHeartbeat(stored.sessionId);
    successResponse({ res, data: { alive: true } });
});
//# sourceMappingURL=auth-session.controller.js.map