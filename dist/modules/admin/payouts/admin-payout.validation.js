import { z } from 'zod';
export const updateCommissionSchema = z.object({
    params: z.object({
        instructorId: z.string().uuid(),
    }),
    body: z.object({
        commissionRate: z.number().min(0).max(100),
    }),
});
export const listPayoutsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(20),
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
        instructorId: z.string().uuid().optional(),
    }),
});
export const processPayoutSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED', 'PAID']),
        adminNotes: z.string().optional(),
    }),
});
//# sourceMappingURL=admin-payout.validation.js.map