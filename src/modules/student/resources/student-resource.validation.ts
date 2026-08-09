import { z } from 'zod';

export const lessonIdParamSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
});
