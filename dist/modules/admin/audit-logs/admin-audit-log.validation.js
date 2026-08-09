import { z } from 'zod';
export const listAuditLogsSchema = z.object({
    query: z.object({
        page: z.coerce.number().optional(),
        limit: z.coerce.number().max(100).optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        userId: z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=admin-audit-log.validation.js.map