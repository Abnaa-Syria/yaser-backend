import { z } from 'zod';
export const listCohortsQuerySchema = z.object({
    query: z.object({
        status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']).optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
export const classIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid class ID format'),
    }),
});
export const updateStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid class ID format'),
    }),
    body: z.object({
        status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'MISSED']),
    }),
});
//# sourceMappingURL=instructor-class.validation.js.map