import { z } from 'zod';
const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);
const optionalUuid = z.string().uuid().optional().nullable();
function coerceDueOnly(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    if (value === true || value === 'true' || value === '1')
        return true;
    if (value === false || value === 'false' || value === '0')
        return false;
    return undefined;
}
export const listFlashcardsSchema = z.object({
    query: z.object({
        courseId: z.string().uuid().optional(),
        unitId: z.string().uuid().optional(),
        lessonId: z.string().uuid().optional(),
        dueOnly: z.preprocess(coerceDueOnly, z.boolean().optional()),
    }),
});
export const reviewFlashcardSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        difficulty: difficultySchema,
    }),
});
export const listPersonalFlashcardsSchema = z.object({
    query: z.object({
        courseId: z.string().uuid().optional(),
        unitId: z.string().uuid().optional(),
        lessonId: z.string().uuid().optional(),
        dueOnly: z.preprocess(coerceDueOnly, z.boolean().optional()),
    }),
});
export const createPersonalFlashcardSchema = z.object({
    body: z.object({
        front: z.string().min(1).max(10000),
        frontAr: z.string().max(10000).optional().nullable(),
        back: z.string().min(1).max(10000),
        backAr: z.string().max(10000).optional().nullable(),
        explanation: z.string().max(20000).optional().nullable(),
        explanationAr: z.string().max(20000).optional().nullable(),
        courseId: optionalUuid,
        unitId: optionalUuid,
        lessonId: optionalUuid,
        displayOrder: z.number().int().min(0).optional(),
    }),
});
export const updatePersonalFlashcardSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        front: z.string().min(1).max(10000).optional(),
        frontAr: z.string().max(10000).optional().nullable(),
        back: z.string().min(1).max(10000).optional(),
        backAr: z.string().max(10000).optional().nullable(),
        explanation: z.string().max(20000).optional().nullable(),
        explanationAr: z.string().max(20000).optional().nullable(),
        courseId: optionalUuid,
        unitId: optionalUuid,
        lessonId: optionalUuid,
        displayOrder: z.number().int().min(0).optional(),
    }),
});
export const personalFlashcardIdSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});
export const reviewPersonalFlashcardSchema = reviewFlashcardSchema;
//# sourceMappingURL=student-flashcard.validation.js.map