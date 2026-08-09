import { z } from 'zod';
const statusSchema = z.enum(['NEW', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'ARCHIVED']);
export const applicationIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});
export const listApplicationsSchema = z.object({
    query: z.object({
        status: statusSchema.optional(),
    }),
});
export const updateApplicationSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        status: statusSchema.optional(),
        adminNotes: z.string().max(3000).optional(),
    }),
});
//# sourceMappingURL=admin-instructor-application.validation.js.map