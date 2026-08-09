import { z } from 'zod';
const emptyToUndefined = (val) => val === '' || val === null || val === 'null' || val === 'undefined' ? undefined : val;
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalNullableUrl = z.preprocess((val) => (val === '' ? null : val), z.string().url().nullable().optional());
const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const optionalNullableUuid = z.preprocess((val) => {
    if (val === '')
        return null;
    if (val === null)
        return null;
    if (val === undefined)
        return undefined;
    return val;
}, z.union([z.string().uuid(), z.null()]).optional());
export const courseIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid course ID format'),
    }),
});
export const createCourseSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200),
        description: z.string().optional(),
        thumbnail: optionalUrl,
        introVideoUrl: optionalUrl,
        categoryId: optionalUuid,
        price: z.number().nonnegative().optional(),
        isLifetimePurchasable: z.boolean().optional(),
        type: z.enum(['HYBRID', 'RECORDED']).optional(),
        targetLevels: z.array(z.string()).optional().nullable(),
        pricingTiers: z.array(z.object({
            name: z.string().min(1),
            nameAr: z.string().min(1),
            price: z.number().nonnegative(),
            durationDays: z.number().int().positive().nullable().optional(),
            isActive: z.boolean().optional(),
        })).optional(),
    }),
});
export const updateCourseSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid course ID format'),
    }),
    body: z.object({
        title: z.string().min(3).max(200).optional(),
        description: z.string().optional(),
        thumbnail: optionalUrl,
        introVideoUrl: optionalNullableUrl,
        categoryId: optionalNullableUuid,
        price: z.number().nonnegative().optional(),
        isLifetimePurchasable: z.boolean().optional(),
        type: z.enum(['HYBRID', 'RECORDED']).optional(),
        targetLevels: z.array(z.string()).optional().nullable(),
        pricingTiers: z.array(z.object({
            id: z.string().uuid().optional(),
            name: z.string().min(1),
            nameAr: z.string().min(1),
            price: z.number().nonnegative(),
            durationDays: z.number().int().positive().nullable().optional(),
            isActive: z.boolean().optional(),
        })).optional(),
    }),
});
export const listCoursesQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
        categoryId: z.preprocess((val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val), z.string().uuid().optional()),
        status: z
            .enum(['active', 'inactive', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'])
            .optional(),
        search: z.string().optional(),
    }),
});
//# sourceMappingURL=instructor-course.validation.js.map