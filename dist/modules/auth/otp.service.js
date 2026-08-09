import crypto from 'crypto';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, comparePassword } from '../../utils/security/hash.js';
const OTP_TTL_MS = 5 * 60 * 1000;
const generateOtpCode = () => String(crypto.randomInt(100000, 999999));
export const requestOtp = async (input) => {
    const code = generateOtpCode();
    const hashed = await hashPassword(code);
    await prisma.otpVerification.create({
        data: {
            userId: input.userId,
            code: hashed,
            purpose: input.purpose,
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
            ipAddress: input.ipAddress,
        },
    });
    const isDev = process.env.NODE_ENV === 'development';
    return {
        message: 'OTP sent successfully',
        ...(isDev && { code }),
    };
};
export const verifyOtp = async (input) => {
    const record = await prisma.otpVerification.findFirst({
        where: {
            userId: input.userId,
            purpose: input.purpose,
            isUsed: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });
    if (!record) {
        throw new AppError('OTP expired or not found', 400);
    }
    const valid = await comparePassword(input.code, record.code);
    if (!valid) {
        throw new AppError('Invalid OTP code', 400);
    }
    await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true, verifiedAt: new Date() },
    });
    return { verified: true };
};
//# sourceMappingURL=otp.service.js.map