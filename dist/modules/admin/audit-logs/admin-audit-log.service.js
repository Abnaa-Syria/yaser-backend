import { prisma } from '../../../prisma.js';
export const listAuditLogs = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = {};
    if (query.action)
        where.action = query.action;
    if (query.entityType)
        where.entityType = query.entityType;
    if (query.userId)
        where.userId = query.userId;
    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);
    return { logs, total, page, limit };
};
//# sourceMappingURL=admin-audit-log.service.js.map