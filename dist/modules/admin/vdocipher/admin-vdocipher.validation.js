import { z } from 'zod';
export const listVideosQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(40).optional(),
        q: z.string().trim().max(120).optional(),
    }),
});
//# sourceMappingURL=admin-vdocipher.validation.js.map