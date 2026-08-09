import { z } from 'zod';

export const startTrialSchema = z.object({
  body: z.object({
    fingerprint: z.string().min(8).max(191),
    deviceName: z.string().max(120).optional(),
    os: z.string().max(80).optional(),
  }),
});

export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const lessonIdParamSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid(),
  }),
});

export const examIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const examResultParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    submissionId: z.string().uuid(),
  }),
});

export const submitTrialExamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().uuid(),
        optionId: z.string().max(120).optional(),
        answerText: z.string().nullable().optional(),
      })
    ),
  }),
});
