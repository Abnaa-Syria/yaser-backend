import { z } from 'zod';
export const createReviewSchema = z.object({
    params: z.object({
        courseId: z.string().uuid(),
    }),
    body: z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().min(1).max(1000),
    }),
});
export const updateReviewSchema = z.object({
    params: z.object({
        reviewId: z.string().uuid(),
    }),
    body: z.object({
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().min(1).max(1000).optional(),
    }),
});
//# sourceMappingURL=student-review.validation.js.map