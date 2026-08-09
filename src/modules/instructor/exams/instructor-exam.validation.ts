import { z } from 'zod';

export const listExamsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }),
});

export const courseStructureParamSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid course ID format'),
  }),
});

export const examIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid exam ID format'),
  }),
});

export const questionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid exam ID format'),
    questionId: z.string().uuid('Invalid question ID format'),
  }),
});

const createExamBodySchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    durationMinutes: z.number().int().min(1),
    totalPoints: z.number().int().min(1),
    passingScore: z.number().int().min(0),
    attempts: z.number().int().min(1).optional(),
    courseId: z.string().uuid('Invalid course ID format'),
    unitId: z.string().uuid('Invalid unit ID format').optional(),
    lessonId: z.string().uuid('Invalid lesson ID format').optional(),
    status: z.enum(['UPCOMING', 'AVAILABLE', 'COMPLETED', 'EXPIRED']).optional(),
    targetLevels: z.array(z.string()).optional().nullable(),
    coveredTopics: z.any().optional(),
    examStructure: z.any().optional(),
    importantInstructions: z.any().optional(),
    preparationTips: z.any().optional(),
    readyMessage: z.string().optional(),
  })
  .refine((b) => b.passingScore <= b.totalPoints, {
    message: 'passingScore cannot exceed totalPoints',
    path: ['passingScore'],
  });

export const createExamSchema = z.object({
  body: createExamBodySchema,
});

export const createQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(1, 'Question text is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
    points: z.number().int().min(1),
    order: z.number().int().min(1),
    options: z.any().optional(), // Could be more specific based on JSON structure
    correctAnswer: z.string().optional(),
  }),
});
