import { prisma } from '../prisma.js';
/**
 * Creates or reuses a device, enforces single active session for students,
 * and returns the new session id for refresh-token binding.
 */
export const createUserSession = async (ctx) => {
    const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        include: { role: true },
    });
    if (!user)
        throw new Error('User not found');
    const isStudent = user.role.name === 'STUDENT';
    const fingerprint = ctx.deviceFingerprint ?? `legacy-${ctx.userId}`;
    const device = await prisma.userDevice.upsert({
        where: {
            studentId_deviceFingerprint: {
                studentId: ctx.userId,
                deviceFingerprint: fingerprint,
            },
        },
        create: {
            studentId: ctx.userId,
            deviceFingerprint: fingerprint,
            deviceName: ctx.deviceName,
            os: ctx.os,
        },
        update: {
            deviceName: ctx.deviceName ?? undefined,
            os: ctx.os ?? undefined,
        },
    });
    if (isStudent) {
        await prisma.userSession.updateMany({
            where: { studentId: ctx.userId, isActive: true },
            data: { isActive: false },
        });
    }
    const session = await prisma.userSession.create({
        data: {
            studentId: ctx.userId,
            deviceId: device.id,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
            isActive: true,
            lastHeartbeatAt: new Date(),
        },
    });
    return session.id;
};
export const touchSessionHeartbeat = async (sessionId) => {
    return prisma.userSession.update({
        where: { id: sessionId },
        data: { lastHeartbeatAt: new Date(), isActive: true },
    });
};
export const deactivateSession = async (sessionId) => {
    await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false },
    });
    await prisma.refreshToken.deleteMany({ where: { sessionId } });
};
export const deactivateAllUserSessions = async (userId) => {
    await prisma.userSession.updateMany({
        where: { studentId: userId, isActive: true },
        data: { isActive: false },
    });
    await prisma.refreshToken.deleteMany({ where: { userId } });
};
//# sourceMappingURL=session.service.js.map