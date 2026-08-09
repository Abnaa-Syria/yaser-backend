import { z } from 'zod';
export const courseIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid course ID format'),
    }),
});
export const recommendedCoursesQuerySchema = z.object({
    query: z.object({
        limit: z.coerce.number().int().min(1).max(20).optional(),
    }),
});
//# sourceMappingURL=student-course.validation.js.map