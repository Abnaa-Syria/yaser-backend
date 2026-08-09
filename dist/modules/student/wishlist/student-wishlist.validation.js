import { z } from 'zod';
export const courseIdParamSchema = z.object({
    params: z.object({
        courseId: z.string().uuid(),
    }),
});
//# sourceMappingURL=student-wishlist.validation.js.map