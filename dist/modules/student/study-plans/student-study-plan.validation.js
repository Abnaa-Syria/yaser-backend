import { z } from 'zod';
const itemStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED']);
export const studyPlanIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});
export const studyPlanItemIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid(),
    }),
});
export const createStudyPlanSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200),
        goal: z.string().max(2000).optional(),
        targetDate: z.coerce.date().optional(),
    }),
});
export const updateStudyPlanSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        goal: z.string().max(2000).optional().nullable(),
        targetDate: z.coerce.date().optional().nullable(),
        isArchived: z.boolean().optional(),
    }),
});
export const createStudyPlanItemSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        title: z.string().min(1).max(200),
        notes: z.string().max(2000).optional(),
        scheduledAt: z.coerce.date().optional(),
        status: itemStatus.optional(),
        priority: z.number().int().min(0).optional(),
        order: z.number().int().min(0).optional(),
        courseId: z.string().uuid().optional(),
        unitId: z.string().uuid().optional(),
        lessonId: z.string().uuid().optional(),
    }),
});
export const updateStudyPlanItemSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid(),
    }),
    body: createStudyPlanItemSchema.shape.body.partial(),
});
//# sourceMappingURL=student-study-plan.validation.js.map