import { z } from 'zod';
const emptyToNull = (val) => {
    if (val === undefined)
        return undefined;
    if (val === null || val.trim() === '')
        return null;
    return val.trim();
};
const vdoCipherVideoIdField = z.preprocess((val) => emptyToNull(typeof val === 'string' || val === null || val === undefined ? val : String(val)), z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid VdoCipher video ID')
    .max(64)
    .nullable()
    .optional());
export const lessonIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid lesson ID format'),
    }),
});
export const createLessonSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(200),
        order: z.number().int().min(1),
        sectionId: z.string().uuid('Invalid section ID format'),
        meetingUrl: z.string().nullable().optional(),
        availableAt: z.string().nullable().optional(),
        durationSeconds: z.number().int().min(0).optional(),
        videoUrl: z.string().nullable().optional(),
        vdoCipherVideoId: vdoCipherVideoIdField,
    }),
});
export const updateLessonSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid lesson ID format'),
    }),
    body: z.object({
        title: z.string().min(1, 'Title is required').max(200).optional(),
        order: z.number().int().min(1).optional(),
        videoUrl: z.string().nullable().optional(),
        vdoCipherVideoId: vdoCipherVideoIdField,
        meetingUrl: z.string().nullable().optional(),
        availableAt: z.string().nullable().optional(),
        durationSeconds: z.number().int().min(0).optional(),
    }),
});
export const listLessonsSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
        unitId: z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=admin-lesson.validation.js.map