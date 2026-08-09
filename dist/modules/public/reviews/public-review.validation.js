import { z } from 'zod';
export const getReviewsSchema = z.object({
    params: z.object({
        courseId: z.string().uuid(),
    }),
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
    }),
});
//# sourceMappingURL=public-review.validation.js.map