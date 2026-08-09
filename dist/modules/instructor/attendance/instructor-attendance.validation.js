import { z } from 'zod';
export const listAttendanceSessionsQuerySchema = z.object({
    query: z.object({
        courseId: z.string().uuid().optional(),
        status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'MISSED']).optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
export const sessionIdParamSchema = z.object({
    params: z.object({
        sessionId: z.string().uuid('Invalid session ID format'),
    }),
});
export const markAttendanceSchema = z.object({
    params: z.object({
        sessionId: z.string().uuid('Invalid session ID format'),
        studentId: z.string().uuid('Invalid student ID format'),
    }),
    body: z.object({
        present: z.boolean(),
    }),
});
//# sourceMappingURL=instructor-attendance.validation.js.map