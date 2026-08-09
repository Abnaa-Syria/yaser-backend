import { z } from 'zod';
export const classIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid class ID format'),
    }),
});
//# sourceMappingURL=student-class.validation.js.map