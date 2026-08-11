import { z } from 'zod';
export const lessonIdParamSchema = z.object({
    params: z.object({
        lessonId: z.string().uuid('Invalid lesson ID format'),
    }),
});
export const courseIdParamSchema = z.object({
    params: z.object({
        courseId: z.string().uuid('Invalid course ID format'),
    }),
});
export const trackLessonAccessSchema = z.object({
    params: z.object({
        lessonId: z.string().uuid('Invalid lesson ID format'),
    }),
    body: z.object({
        courseId: z.string().uuid().optional(),
        watchPercentage: z.coerce.number().min(0).max(100).optional(),
        lastWatchedPosition: z.coerce.number().int().min(0).optional(),
        timeSpentDelta: z.coerce.number().int().min(0).max(120).optional(),
    }),
});
export const completeLessonSchema = z.object({
    params: z.object({
        lessonId: z.string().uuid('Invalid lesson ID format'),
    }),
    body: z.object({
        courseId: z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=student-progress.validation.js.map