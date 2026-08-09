import { z } from 'zod';

export const lessonPlaybackParamSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid('Invalid lesson ID format'),
  }),
});
