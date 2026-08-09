import { z } from 'zod';

export const listFlashcardsSchema = z.object({
  query: z.object({
    courseId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
    lessonId: z.string().uuid().optional(),
  }),
});
