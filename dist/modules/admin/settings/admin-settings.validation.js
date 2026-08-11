import { z } from 'zod';
export const updateSettingsSchema = z.object({
    body: z
        .record(z.string(), z.any())
        .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one setting key is required' }),
});
export const createEmailTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(3),
        subject: z.string().min(5),
        body: z.string().min(10) // HTML content
    })
});
export const updateEmailTemplateSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        name: z.string().min(3).optional(),
        subject: z.string().min(5).optional(),
        body: z.string().min(10).optional()
    })
});
export const previewEmailTemplateSchema = z.object({
    body: z.object({
        id: z.string().uuid().optional(),
        subject: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        vars: z.record(z.string(), z.string()).optional(),
    }),
});
export const sendTestEmailTemplateSchema = z.object({
    body: z.object({
        id: z.string().uuid().optional(),
        to: z.string().email(),
        subject: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        vars: z.record(z.string(), z.string()).optional(),
    }),
});
//# sourceMappingURL=admin-settings.validation.js.map