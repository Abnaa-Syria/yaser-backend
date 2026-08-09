import { z } from 'zod';

export const lessonIdParamSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
});

export const createQuestionSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255),
    body: z.string().min(1).max(2000),
  }),
});

export const createAnswerSchema = z.object({
  params: z.object({
    questionId: z.string().uuid(),
  }),
  body: z.object({
    body: z.string().min(1).max(2000),
  }),
});
