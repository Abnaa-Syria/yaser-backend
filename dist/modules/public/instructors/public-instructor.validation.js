import { z } from 'zod';
export const instructorIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid instructor ID format'),
    }),
});
export const listInstructorsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
//# sourceMappingURL=public-instructor.validation.js.map