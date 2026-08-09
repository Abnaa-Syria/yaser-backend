import { z } from 'zod';

export const adminAnswerSchema = z.object({
  params: z.object({
    questionId: z.string().uuid(),
  }),
  body: z.object({
    body: z.string().min(1).max(2000),
  }),
});

export const questionIdParamSchema = z.object({
  params: z.object({
    questionId: z.string().uuid(),
  }),
});

export const listQuestionsQuerySchema = z.object({
  query: z.object({
    courseId: z.string().uuid().optional(),
    lessonId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    resolved: z.enum(['true', 'false']).optional(),
    search: z.string().max(200).optional(),
  }),
});
