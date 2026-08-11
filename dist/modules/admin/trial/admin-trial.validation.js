import { z } from 'zod';
export const updateTrialSettingsSchema = z.object({
    body: z.object({
        enabled: z.boolean().optional(),
        durationDays: z.number().int().min(1).max(90).optional(),
        popupEnabled: z.boolean().optional(),
        title: z.string().min(1).max(200).optional(),
        titleAr: z.string().min(1).max(200).optional(),
        subtitle: z.string().min(1).max(500).optional(),
        subtitleAr: z.string().min(1).max(500).optional(),
        ctaLabel: z.string().min(1).max(120).optional(),
        ctaLabelAr: z.string().min(1).max(120).optional(),
        dismissDays: z.number().int().min(0).max(365).optional(),
    }),
});
export const replaceTrialCoursesSchema = z.object({
    body: z.object({
        courses: z.array(z.object({
            courseId: z.string().uuid(),
            displayOrder: z.number().int().min(0).optional(),
            isActive: z.boolean().optional(),
        })),
    }),
});
export const listTrialSessionsSchema = z.object({
    query: z.object({
        status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED', 'ALL']).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        q: z.string().max(200).optional(),
    }),
});
export const trialSessionIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});
export const revokeTrialSessionSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z
        .object({
        reason: z.string().max(500).optional(),
    })
        .optional()
        .default({}),
});
//# sourceMappingURL=admin-trial.validation.js.map