import { z } from 'zod';
export const submitInstructorApplicationSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(200),
        email: z.string().email(),
        phone: z.string().max(50).optional(),
        specialty: z.string().max(1000).optional(),
        experience: z.string().max(2000).optional(),
        message: z.string().min(10).max(5000),
        documentUrl: z.string().min(1).optional(),
    }),
});
//# sourceMappingURL=public-instructor-application.validation.js.map