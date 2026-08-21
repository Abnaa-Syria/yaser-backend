import { z } from 'zod';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { comparePassword } from '../../utils/security/hash.js';
import { normalizeUsername } from '../../utils/username.js';
export const requestDeviceReplacementSchema = z.object({
    body: z.object({
        identifier: z.string().min(1),
        password: z.string().min(1),
        oldDeviceId: z.string().uuid(),
        deviceFingerprint: z.string().min(8).max(191),
        deviceName: z.string().max(120).optional(),
        os: z.string().max(120).optional(),
    }),
});
export const reviewDeviceReplacementSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z
        .object({
        note: z.string().max(500).optional(),
    })
        .optional()
        .default({}),
});
async function findStudentByCredentials(identifier, password) {
    const identifierTrim = identifier.trim();
    const identifierLower = identifierTrim.toLowerCase();
    const looksLikeEmail = identifierLower.includes('@');
    const user = await prisma.user.findFirst({
        where: {
            deletedAt: null,
            ...(looksLikeEmail
                ? { email: identifierLower }
                : {
                    OR: [{ username: normalizeUsername(identifierTrim) }, { email: identifierLower }],
                }),
        },
        include: { role: true },
    });
    if (!user || user.role.name !== 'STUDENT') {
        throw new AppError('Invalid email/username or password.', 401);
    }
    const ok = await comparePassword(password, user.password);
    if (!ok)
        throw new AppError('Invalid email/username or password.', 401);
    if (!user.isActive)
        throw new AppError('Your account has been deactivated.', 403);
    return user;
}
export async function requestDeviceReplacement(input) {
    const user = await findStudentByCredentials(input.identifier, input.password);
    const oldDevice = await prisma.userDevice.findFirst({
        where: { id: input.oldDeviceId, studentId: user.id, isTrusted: true },
    });
    if (!oldDevice)
        throw new AppError('Trusted device not found.', 404);
    const existingSame = await prisma.userDevice.findUnique({
        where: {
            studentId_deviceFingerprint: {
                studentId: user.id,
                deviceFingerprint: input.deviceFingerprint,
            },
        },
    });
    if (existingSame?.isTrusted) {
        throw new AppError('This device is already trusted. Try logging in again.', 400);
    }
    const pending = await prisma.deviceReplacementRequest.findFirst({
        where: { studentId: user.id, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
    });
    if (pending) {
        return {
            id: pending.id,
            status: pending.status,
            message: 'You already have a pending device replacement request.',
            alreadyPending: true,
        };
    }
    const created = await prisma.deviceReplacementRequest.create({
        data: {
            studentId: user.id,
            oldDeviceId: oldDevice.id,
            newFingerprint: input.deviceFingerprint,
            newDeviceName: input.deviceName,
            newOs: input.os,
            status: 'PENDING',
        },
    });
    return {
        id: created.id,
        status: created.status,
        message: 'Replacement request submitted. Wait for admin approval.',
        alreadyPending: false,
    };
}
export async function listDeviceReplacementRequests(status) {
    const where = status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)
        ? { status: status }
        : {};
    return prisma.deviceReplacementRequest.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
            student: { select: { id: true, fullName: true, email: true, username: true } },
            oldDevice: {
                select: { id: true, deviceName: true, os: true, deviceFingerprint: true, updatedAt: true },
            },
            reviewedBy: { select: { id: true, fullName: true } },
        },
        take: 200,
    });
}
export async function approveDeviceReplacement(id, adminId, note) {
    const req = await prisma.deviceReplacementRequest.findUnique({ where: { id } });
    if (!req)
        throw new AppError('Request not found.', 404);
    if (req.status !== 'PENDING')
        throw new AppError('Request is not pending.', 400);
    await prisma.$transaction(async (tx) => {
        await tx.userDevice.update({
            where: { id: req.oldDeviceId },
            data: { isTrusted: false },
        });
        await tx.userSession.updateMany({
            where: { deviceId: req.oldDeviceId, isActive: true },
            data: { isActive: false },
        });
        await tx.userDevice.upsert({
            where: {
                studentId_deviceFingerprint: {
                    studentId: req.studentId,
                    deviceFingerprint: req.newFingerprint,
                },
            },
            create: {
                studentId: req.studentId,
                deviceFingerprint: req.newFingerprint,
                deviceName: req.newDeviceName,
                os: req.newOs,
                isTrusted: true,
            },
            update: {
                isTrusted: true,
                deviceName: req.newDeviceName ?? undefined,
                os: req.newOs ?? undefined,
            },
        });
        await tx.deviceReplacementRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedById: adminId,
                reviewedAt: new Date(),
                note: note || null,
            },
        });
    });
    return { id, status: 'APPROVED' };
}
export async function rejectDeviceReplacement(id, adminId, note) {
    const req = await prisma.deviceReplacementRequest.findUnique({ where: { id } });
    if (!req)
        throw new AppError('Request not found.', 404);
    if (req.status !== 'PENDING')
        throw new AppError('Request is not pending.', 400);
    await prisma.deviceReplacementRequest.update({
        where: { id },
        data: {
            status: 'REJECTED',
            reviewedById: adminId,
            reviewedAt: new Date(),
            note: note || null,
        },
    });
    return { id, status: 'REJECTED' };
}
//# sourceMappingURL=device-replacement.service.js.map