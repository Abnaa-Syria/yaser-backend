import { z } from 'zod';
import { mediaUrlOrEmpty } from '../../../utils/mediaUrl.js';
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
export const createExamSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(200),
        description: z.string().optional(),
        scheduledAt: z.string().datetime().optional(),
        durationMinutes: z.number().int().min(1),
        totalPoints: z.number().int().min(1),
        passingScore: z.number().int().min(1),
        courseId: z.string().uuid('Invalid course ID format').optional(),
        unitId: z.string().uuid('Invalid unit ID format').optional(),
        lessonId: z.string().uuid('Invalid lesson ID format').optional(),
        type: z.enum(['FINAL', 'UNIT', 'LESSON', 'STANDALONE']).default('STANDALONE'),
        status: z.enum(['UPCOMING', 'AVAILABLE', 'COMPLETED', 'EXPIRED']).optional(),
        targetLevels: z.array(z.string()).optional().nullable(),
        coveredTopics: z.any().optional(),
        examStructure: z.any().optional(),
        importantInstructions: z.any().optional(),
        preparationTips: z.any().optional(),
        readyMessage: z.string().optional(),
    }),
});
export const createQuestionSchema = z.object({
    body: z.object({
        questionText: z.string().min(1, 'Question text is required'),
        type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
        points: z.number().int().min(1),
        order: z.number().int().min(1),
        options: z.any().optional(),
        correctAnswer: z.string().optional(),
        explanation: z.string().optional().nullable(),
        explanationAr: z.string().optional().nullable(),
        imageUrl: mediaUrlOrEmpty.optional().nullable(),
    }),
});
export const listExamsSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
        courseId: z.preprocess((val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val), z.string().uuid().optional()),
        unitId: z.preprocess((val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val), z.string().uuid().optional()),
        lessonId: z.preprocess((val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val), z.string().uuid().optional()),
        type: z.enum(['FINAL', 'UNIT', 'LESSON', 'STANDALONE']).optional(),
        status: z.enum(['UPCOMING', 'AVAILABLE', 'COMPLETED', 'EXPIRED']).optional(),
    }),
});
//# sourceMappingURL=admin-exam.validation.js.map