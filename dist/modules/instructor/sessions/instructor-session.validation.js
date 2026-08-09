import { z } from 'zod';
const emptyToUndefined = (val) => val === '' || val === null || val === 'null' || val === 'undefined' ? undefined : val;
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalNullableUrl = z.preprocess((val) => (val === '' ? null : val), z.string().url().nullable().optional());
export const courseIdParamSchema = z.object({
    params: z.object({
        courseId: z.string().uuid('Invalid course ID format'),
    }),
});
export const sessionIdParamSchema = z.object({
    params: z.object({
        courseId: z.string().uuid('Invalid course ID format'),
        sessionId: z.string().uuid('Invalid session ID format'),
    }),
});
export const createSessionSchema = z.object({
    params: z.object({ courseId: z.string().uuid() }),
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        meetingUrl: optionalUrl,
    }),
});
export const updateSessionSchema = z.object({
    params: z.object({
        courseId: z.string().uuid(),
        sessionId: z.string().uuid(),
    }),
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        meetingUrl: optionalNullableUrl,
        recordingUrl: optionalNullableUrl,
        status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'MISSED']).optional(),
    }),
});
//# sourceMappingURL=instructor-session.validation.js.map