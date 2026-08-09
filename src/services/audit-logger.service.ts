import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

export type AuditLogInput = {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
};

export const logAudit = async (input: AuditLogInput) => {
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
