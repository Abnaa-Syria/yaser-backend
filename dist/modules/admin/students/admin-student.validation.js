import { z } from 'zod';
export const studentIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Student id is required'),
    }),
});
//# sourceMappingURL=admin-student.validation.js.map