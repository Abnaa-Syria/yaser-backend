import { prisma } from '../prisma.js';
export const logAudit = async (input) => {
    return prisma.auditLog.create({
        data: {
            userId: input.userId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            details: input.details ?? {},
            ipAddress: input.ipAddress,
        },
    });
};
//# sourceMappingURL=audit-logger.service.js.map