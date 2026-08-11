import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { loadTrialSettings, trialSettingsToKeyMap, } from '../../trial/trial-settings.js';
import { sessionStatus } from '../../trial/trial.service.js';
export async function getAdminTrialSettings() {
    const settings = await loadTrialSettings();
    const courses = await prisma.trialCourse.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    thumbnail: true,
                    isActive: true,
                    publishStatus: true,
                    status: true,
                    deletedAt: true,
                },
            },
        },
    });
    return {
        settings,
        courses: courses.map((row) => ({
            id: row.id,
            courseId: row.courseId,
            displayOrder: row.displayOrder,
            isActive: row.isActive,
            course: row.course,
        })),
    };
}
export async function updateAdminTrialSettings(partial) {
    const keyMap = trialSettingsToKeyMap(partial);
    const entries = Object.entries(keyMap);
    if (entries.length === 0) {
        throw new AppError('No trial settings provided', 400);
    }
    await prisma.$transaction(entries.map(([key, value]) => prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    })));
    return loadTrialSettings();
}
export async function replaceTrialCourses(items) {
    const courseIds = [...new Set(items.map((i) => i.courseId))];
    if (courseIds.length > 0) {
        const existing = await prisma.course.findMany({
            where: { id: { in: courseIds }, deletedAt: null },
            select: { id: true },
        });
        const found = new Set(existing.map((c) => c.id));
        const missing = courseIds.filter((id) => !found.has(id));
        if (missing.length) {
            throw new AppError(`Unknown course ids: ${missing.slice(0, 5).join(', ')}`, 400);
        }
    }
    await prisma.$transaction(async (tx) => {
        await tx.trialCourse.deleteMany({});
        if (items.length === 0)
            return;
        await tx.trialCourse.createMany({
            data: items.map((item, index) => ({
                courseId: item.courseId,
                displayOrder: item.displayOrder ?? index,
                isActive: item.isActive !== false,
            })),
        });
    });
    return getAdminTrialSettings();
}
export async function listTrialSessions(input) {
    const page = Math.max(1, Number(input.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(input.limit) || 20));
    const skip = (page - 1) * limit;
    const status = input.status || 'ALL';
    const now = new Date();
    const q = String(input.q || '').trim();
    const where = {};
    if (status === 'REVOKED') {
        where.revokedAt = { not: null };
    }
    else if (status === 'ACTIVE') {
        where.revokedAt = null;
        where.expiresAt = { gt: now };
    }
    else if (status === 'EXPIRED') {
        where.revokedAt = null;
        where.expiresAt = { lte: now };
    }
    if (q) {
        where.OR = [
            { fingerprint: { contains: q } },
            { deviceName: { contains: q } },
            { os: { contains: q } },
            { ipAddress: { contains: q } },
            { userAgent: { contains: q } },
        ];
    }
    const [total, rows] = await Promise.all([
        prisma.trialSession.count({ where }),
        prisma.trialSession.findMany({
            where,
            orderBy: [{ lastSeenAt: 'desc' }, { startedAt: 'desc' }],
            skip,
            take: limit,
        }),
    ]);
    const sessions = rows.map((row) => {
        const st = sessionStatus(row);
        const msLeft = row.expiresAt.getTime() - Date.now();
        return {
            id: row.id,
            fingerprint: row.fingerprint,
            fingerprintShort: row.fingerprint.slice(0, 12),
            deviceName: row.deviceName,
            os: row.os,
            ipAddress: row.ipAddress,
            userAgent: row.userAgent,
            startedAt: row.startedAt.toISOString(),
            expiresAt: row.expiresAt.toISOString(),
            lastSeenAt: row.lastSeenAt.toISOString(),
            revokedAt: row.revokedAt?.toISOString() || null,
            revokeReason: row.revokeReason,
            status: st,
            remainingMs: st === 'ACTIVE' ? Math.max(0, msLeft) : 0,
            remainingDays: st === 'ACTIVE' ? Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000))) : 0,
        };
    });
    const [activeCount, expiredCount, revokedCount] = await Promise.all([
        prisma.trialSession.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
        prisma.trialSession.count({ where: { revokedAt: null, expiresAt: { lte: now } } }),
        prisma.trialSession.count({ where: { revokedAt: { not: null } } }),
    ]);
    return {
        sessions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        counts: {
            active: activeCount,
            expired: expiredCount,
            revoked: revokedCount,
            all: activeCount + expiredCount + revokedCount,
        },
    };
}
export async function revokeTrialSession(sessionId, reason) {
    const session = await prisma.trialSession.findUnique({ where: { id: sessionId } });
    if (!session)
        throw new AppError('Trial session not found.', 404);
    if (session.revokedAt) {
        return {
            id: session.id,
            status: 'REVOKED',
            revokedAt: session.revokedAt.toISOString(),
            revokeReason: session.revokeReason,
            alreadyRevoked: true,
        };
    }
    const updated = await prisma.trialSession.update({
        where: { id: sessionId },
        data: {
            revokedAt: new Date(),
            revokeReason: reason?.trim()?.slice(0, 500) || 'Stopped by administrator',
        },
    });
    return {
        id: updated.id,
        status: 'REVOKED',
        revokedAt: updated.revokedAt.toISOString(),
        revokeReason: updated.revokeReason,
        alreadyRevoked: false,
    };
}
export async function restoreTrialSession(sessionId) {
    const session = await prisma.trialSession.findUnique({ where: { id: sessionId } });
    if (!session)
        throw new AppError('Trial session not found.', 404);
    if (!session.revokedAt) {
        throw new AppError('Session is not revoked.', 400);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
        throw new AppError('Cannot restore an expired trial. Time window already ended.', 400);
    }
    const updated = await prisma.trialSession.update({
        where: { id: sessionId },
        data: { revokedAt: null, revokeReason: null },
    });
    return {
        id: updated.id,
        status: sessionStatus(updated),
        expiresAt: updated.expiresAt.toISOString(),
    };
}
//# sourceMappingURL=admin-trial.service.js.map