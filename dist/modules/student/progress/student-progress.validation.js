import { z } from 'zod';
export const lessonIdParamSchema = z.object({
    params: z.object({
        lessonId: z.string().uuid(),
    }),
});
export const courseIdParamSchema = z.object({
    params: z.object({
        courseId: z.string().uuid(),
    }),
});
//# sourceMappingURL=student-progress.validation.js.map