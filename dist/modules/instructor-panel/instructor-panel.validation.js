import { z } from 'zod';
export const listClassesSchema = z.object({
    query: z.object({
        status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'MISSED']).optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
//# sourceMappingURL=instructor-panel.validation.js.map