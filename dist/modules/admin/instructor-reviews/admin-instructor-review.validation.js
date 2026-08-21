import { z } from 'zod';
export const listInstructorReviewsSchema = z.object({
    query: z.object({
        instructorId: z.string().uuid().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
        includeHidden: z.enum(['true', 'false']).optional(),
    }),
});
export const createInstructorReviewSchema = z.object({
    body: z.object({
        instructorId: z.string().uuid().optional(),
        displayName: z.string().min(2).max(120),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(2000).optional().nullable(),
        isVisible: z.boolean().optional(),
        isFeaturedOnHome: z.boolean().optional(),
        studentId: z.string().uuid().optional().nullable(),
    }),
});
export const updateInstructorReviewSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        displayName: z.string().min(2).max(120).optional(),
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().max(2000).optional().nullable(),
        isVisible: z.boolean().optional(),
        isFeaturedOnHome: z.boolean().optional(),
    }),
});
export const instructorReviewIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});
//# sourceMappingURL=admin-instructor-review.validation.js.map