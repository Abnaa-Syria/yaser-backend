import crypto from 'crypto';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, comparePassword, verifyPassword } from '../../utils/security/hash.js';
import { generateToken, verifyToken } from '../../utils/security/jwt.js';
import { createUserSession, deactivateAllUserSessions } from '../../services/session.service.js';
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
const getStudentRoleId = async () => {
    const role = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!role)
        throw new AppError('STUDENT role is not configured.', 500);
    return role.id;
};
const generateAuthTokens = (userId, roleName) => {
    const accessToken = generateToken({
        payload: { userId, role: roleName },
        expiresIn: process.env.JWT_EXPIRE || '15m',
        secret: process.env.JWT_SECRET,
    });
    const refreshToken = generateToken({
        payload: { userId },
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
    });
    return { accessToken, refreshToken };
};
const persistRefreshToken = async (userId, refreshToken, sessionId) => {
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId,
            sessionId,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
        },
    });
};
export const registerUser = async (data) => {
    const email = data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('Email is already in use.', 409);
    }
    const hashedPassword = await hashPassword(data.password);
    const studentRoleId = await getStudentRoleId();
    const user = await prisma.user.create({
        data: {
            fullName: data.fullName.trim(),
            email,
            password: hashedPassword,
            phone: data.phone?.trim() || undefined,
            roleId: studentRoleId,
            academicLevel: data.academicLevel || null,
        },
        include: {
            role: true,
        },
    });
    const tokens = generateAuthTokens(user.id, user.role.name);
    const sessionId = await createUserSession({
        userId: user.id,
        deviceFingerprint: data.deviceFingerprint,
        deviceName: data.deviceName,
        os: data.os,
    });
    await persistRefreshToken(user.id, tokens.refreshToken, sessionId);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
};
export const loginUser = async (data) => {
    const email = data.identifier.trim().toLowerCase();
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            role: {
                include: {
                    permissions: { include: { permission: true } },
                },
            },
            userPermissions: { include: { permission: true } },
        },
    });
    if (!user) {
        throw new AppError('Invalid email or password.', 401);
    }
    const passwordCheck = await verifyPassword(data.password, user.password);
    if (!passwordCheck.valid) {
        throw new AppError('Invalid email or password.', 401);
    }
    if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }
    const tokens = generateAuthTokens(user.id, user.role.name);
    const sessionId = await createUserSession({
        userId: user.id,
        deviceFingerprint: data.deviceFingerprint,
        deviceName: data.deviceName,
        os: data.os,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
    });
    const userUpdateData = {
        lastLoginAt: new Date(),
    };
    if (passwordCheck.needsRehash) {
        userUpdateData.password = await hashPassword(data.password);
        userUpdateData.legacyPasswordRehashedAt = new Date();
    }
    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: userUpdateData,
        }),
        prisma.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: user.id,
                sessionId,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
            },
        }),
    ]);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
};
export const logoutUser = async (refreshToken) => {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
        await prisma.userSession.updateMany({
            where: { id: stored.sessionId },
            data: { isActive: false },
        });
    }
    return { loggedOut: true };
};
export const refreshAuthTokens = async (oldRefreshToken) => {
    let decoded;
    try {
        decoded = verifyToken({
            token: oldRefreshToken,
            secret: process.env.JWT_REFRESH_SECRET,
        });
    }
    catch {
        throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
    }
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: oldRefreshToken },
        include: { user: { include: { role: true } }, session: true },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
        if (storedToken) {
            await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        }
        throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
    }
    if (!storedToken.session.isActive) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new AppError('Session has ended. Please log in again.', 401);
    }
    const user = storedToken.user;
    if (!user.isActive) {
        throw new AppError('Your account has been deactivated.', 403);
    }
    const tokens = generateAuthTokens(user.id, user.role.name);
    await prisma.$transaction([
        prisma.refreshToken.delete({ where: { id: storedToken.id } }),
        prisma.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: user.id,
                sessionId: storedToken.sessionId,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
            },
        }),
    ]);
    return { tokens };
};
export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError('User not found.', 404);
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch)
        throw new AppError('Current password is incorrect.', 400);
    if (currentPassword === newPassword) {
        throw new AppError('New password must be different from the current password.', 400);
    }
    const hashedPassword = await hashPassword(newPassword);
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        }),
    ]);
    await deactivateAllUserSessions(userId);
    return { message: 'Password changed successfully. Please log in again.' };
};
export const forgotPassword = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
        return { message: 'If this email exists, a reset link has been sent.' };
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
        },
    });
    const isDev = process.env.NODE_ENV === 'development';
    return {
        message: 'If this email exists, a reset link has been sent.',
        ...(isDev && { resetToken }),
    };
};
export const resetPassword = async (resetToken, newPassword) => {
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { gt: new Date() },
        },
    });
    if (!user) {
        throw new AppError('Invalid or expired reset token.', 400);
    }
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });
    await deactivateAllUserSessions(user.id);
    return { message: 'Password reset successfully. Please log in with your new password.' };
};
//# sourceMappingURL=auth.service.js.map