import { z } from 'zod';
export const listStudentsQuerySchema = z.object({
    query: z.object({
        courseId: z.string().uuid().optional(),
        search: z.string().optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
export const studentIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid student id.'),
    }),
});
//# sourceMappingURL=instructor-student.validation.js.map