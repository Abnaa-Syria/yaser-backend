import { z } from 'zod';
const statusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const flashcardIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});
export const createFlashcardSchema = z.object({
    body: z.object({
        lessonId: z.string().uuid(),
        front: z.string().min(1),
        frontAr: z.string().optional(),
        back: z.string().min(1),
        backAr: z.string().optional(),
        explanation: z.string().optional(),
        explanationAr: z.string().optional(),
        displayOrder: z.number().int().min(0).optional(),
        status: statusSchema.optional(),
    }),
});
export const updateFlashcardSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: createFlashcardSchema.shape.body.partial(),
});
export const listFlashcardsSchema = z.object({
    query: z.object({
        courseId: z.string().uuid().optional(),
        unitId: z.string().uuid().optional(),
        lessonId: z.string().uuid().optional(),
        status: statusSchema.optional(),
    }),
});
//# sourceMappingURL=admin-flashcard.validation.js.map