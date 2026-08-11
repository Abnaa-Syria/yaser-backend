import { z } from 'zod';
import { PLATFORM_CURRENCY } from '../../../config/currency.js';
import { optionalNullableMediaUrl } from '../../../utils/mediaUrl.js';
const platformCurrencySchema = z
    .string()
    .min(3)
    .max(8)
    .optional()
    .transform(() => PLATFORM_CURRENCY);
export const packageIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid package ID format'),
    }),
});
export const paymentIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid payment ID format'),
    }),
});
export const updatePaymentStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid payment ID format'),
    }),
    body: z.object({
        status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
    }),
});
export const approvePaymentSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid payment ID format'),
    }),
    body: z.object({
        adminNote: z.string().max(2000).optional(),
    }).optional(),
});
export const rejectPaymentSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid payment ID format'),
    }),
    body: z.object({
        rejectionReason: z.string().max(2000).optional(),
    }).optional(),
});
export const createPackageSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200),
        titleAr: z.string().optional(),
        slug: z.string().trim().min(1).optional(),
        shortDescription: z.string().optional(),
        shortDescriptionAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        coverImage: optionalNullableMediaUrl,
        price: z.number().nonnegative(),
        originalPrice: z.number().nonnegative().optional(),
        currency: platformCurrencySchema,
        isActive: z.boolean().optional(),
        publishStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
        isFeatured: z.boolean().optional(),
        displayOrder: z.number().int().min(0).optional(),
        courseIds: z.array(z.string().uuid()).optional(),
        pricingTiers: z.array(z.object({
            name: z.string().min(1),
            nameAr: z.string().min(1).optional(),
            label: z.string().optional(),
            labelAr: z.string().optional(),
            price: z.number().nonnegative(),
            originalPrice: z.number().nonnegative().optional(),
            currency: platformCurrencySchema,
            durationDays: z.number().int().positive().nullable().optional(),
            durationValue: z.number().int().positive().nullable().optional(),
            durationUnit: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR', 'LIFETIME']).nullable().optional(),
            isActive: z.boolean().optional(),
            displayOrder: z.number().int().min(0).optional(),
            description: z.string().optional(),
            descriptionAr: z.string().optional(),
        })).optional(),
    }),
});
export const updatePackageSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        title: z.string().min(3).max(200).optional(),
        titleAr: z.string().optional(),
        slug: z.string().trim().min(1).optional(),
        shortDescription: z.string().optional(),
        shortDescriptionAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        coverImage: optionalNullableMediaUrl,
        price: z.number().nonnegative().optional(),
        originalPrice: z.number().nonnegative().optional(),
        currency: platformCurrencySchema,
        isActive: z.boolean().optional(),
        publishStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
        isFeatured: z.boolean().optional(),
        displayOrder: z.number().int().min(0).optional(),
        courseIds: z.array(z.string().uuid()).optional(),
        pricingTiers: z.array(z.object({
            id: z.string().uuid().optional(),
            name: z.string().min(1),
            nameAr: z.string().min(1).optional(),
            label: z.string().optional(),
            labelAr: z.string().optional(),
            price: z.number().nonnegative(),
            originalPrice: z.number().nonnegative().optional(),
            currency: platformCurrencySchema,
            durationDays: z.number().int().positive().nullable().optional(),
            durationValue: z.number().int().positive().nullable().optional(),
            durationUnit: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR', 'LIFETIME']).nullable().optional(),
            isActive: z.boolean().optional(),
            displayOrder: z.number().int().min(0).optional(),
            description: z.string().optional(),
            descriptionAr: z.string().optional(),
        })).optional(),
    }),
});
//# sourceMappingURL=admin-financial.validation.js.map