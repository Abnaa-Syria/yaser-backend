import { z } from 'zod';
export const createInstructorLiveSessionSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(150),
        description: z.string().optional(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        meetingUrl: z.string().url('Invalid meeting URL').optional().nullable(),
        recordingUrl: z.string().url('Invalid recording URL').optional().nullable(),
        courseId: z.string().uuid().optional().nullable(),
        isFreeForAll: z.boolean().default(false),
        price: z.number().min(0).optional().nullable(),
        targetLevels: z.array(z.string()).optional().nullable(),
    }),
});
export const updateInstructorLiveSessionSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        title: z.string().min(3).max(150).optional(),
        description: z.string().optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        meetingUrl: z.string().url('Invalid meeting URL').optional().nullable(),
        recordingUrl: z.string().url('Invalid recording URL').optional().nullable(),
        courseId: z.string().uuid().optional().nullable(),
        isFreeForAll: z.boolean().optional(),
        price: z.number().min(0).optional().nullable(),
        targetLevels: z.array(z.string()).optional().nullable(),
        status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'MISSED']).optional(),
    }),
});
export const liveSessionIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});
//# sourceMappingURL=instructor-live-session.validation.js.map