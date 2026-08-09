import { z } from 'zod';
export const contactSubmissionSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(120),
        email: z.string().email().max(254),
        subject: z.string().max(200).optional(),
        message: z.string().min(10).max(5000),
    }),
});
export const updateContactSubmissionSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        status: z.enum(['NEW', 'READ', 'ARCHIVED']),
    }),
});
//# sourceMappingURL=public-contact.validation.js.map