import { z } from 'zod';

export const courseIdParamSchema = z.object({
  params: z.object({
    courseId: z.string().uuid(),
  }),
});
