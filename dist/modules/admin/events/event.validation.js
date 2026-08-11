import { z } from 'zod';
import { optionalNullableMediaUrl } from '../../../utils/mediaUrl.js';
export const createEventSchema = z.object({
    body: z.object({
        titleAr: z.string().min(3, 'Arabic title must be at least 3 characters.').max(255),
        titleEn: z.string().min(3, 'English title must be at least 3 characters.').max(255),
        descriptionAr: z.string().min(10, 'Arabic description must be at least 10 characters.'),
        descriptionEn: z.string().min(10, 'English description must be at least 10 characters.'),
        eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid ISO date format for eventDate.',
        }),
        location: z.string().min(3, 'Location must be at least 3 characters.'),
        bannerUrl: optionalNullableMediaUrl,
    }),
});
export const updateEventSchema = z.object({
    body: z.object({
        titleAr: z.string().min(3).max(255).optional(),
        titleEn: z.string().min(3).max(255).optional(),
        descriptionAr: z.string().min(10).optional(),
        descriptionEn: z.string().min(10).optional(),
        eventDate: z
            .string()
            .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid ISO date format for eventDate.',
        })
            .optional(),
        location: z.string().min(3).optional(),
        bannerUrl: optionalNullableMediaUrl,
        isActive: z.boolean().optional(),
    }),
});
export const eventIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid event ID format.'),
    }),
});
//# sourceMappingURL=event.validation.js.map