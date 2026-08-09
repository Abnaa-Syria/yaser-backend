import { z } from 'zod';

export const courseIdParamSchema = z.object({
  params: z.object({
    courseId: z.string().uuid(),
  }),
});

export const certificateIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
