import { z } from 'zod';
import { optionalMediaUrl, optionalNullableMediaUrl } from '../../../utils/mediaUrl.js';

const emptyToUndefined = (val: unknown) =>
  val === '' || val === null || val === 'null' || val === 'undefined' ? undefined : val;

const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());

const optionalNullableUuid = z.preprocess(
  (val) => {
    if (val === '') return null;
    if (val === null) return null;
    if (val === undefined) return undefined;
    return val;
  },
  z.union([z.string().uuid(), z.null()]).optional()
);

export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
  }),
});

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    thumbnail: optionalMediaUrl,
    introVideoUrl: optionalMediaUrl,
    instructorId: optionalUuid,
    categoryId: optionalUuid,
    price: z.number().nonnegative().optional(),
    isLifetimePurchasable: z.boolean().optional(),
    type: z.enum(['RECORDED']).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    useDisplayEnrollmentCount: z.boolean().optional(),
    displayEnrollmentCount: z.number().int().min(0).max(9999999).optional(),
    targetLevels: z.array(z.string()).optional().nullable(),
    includesEn: z.array(z.string()).optional().nullable(),
    includesAr: z.array(z.string()).optional().nullable(),
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
    titleAr: z.string().max(200).optional().nullable(),
    description: z.string().optional().nullable(),
    descriptionAr: z.string().optional().nullable(),
    shortDescription: z.string().max(500).optional().nullable(),
    shortDescriptionAr: z.string().max(500).optional().nullable(),
    thumbnail: optionalNullableMediaUrl,
    coverImage: optionalNullableMediaUrl,
    introVideoUrl: optionalNullableMediaUrl,
    instructorId: optionalNullableUuid,
    categoryId: optionalNullableUuid,
    price: z.number().nonnegative().optional(),
    isLifetimePurchasable: z.boolean().optional(),
    type: z.enum(['RECORDED']).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(9999).optional(),
    useDisplayEnrollmentCount: z.boolean().optional(),
    displayEnrollmentCount: z.number().int().min(0).max(9999999).optional(),
    targetLevels: z.array(z.string()).optional().nullable(),
    includesEn: z.array(z.string()).optional().nullable(),
    includesAr: z.array(z.string()).optional().nullable(),
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

export const assignInstructorSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
  }),
  body: z.object({
    instructorId: z.string().uuid('Invalid instructor ID format'),
  }),
});

export const listCoursesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    categoryId: z.preprocess((val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val), z.string().uuid().optional()),
    instructorId: z.preprocess((val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val), z.string().uuid().optional()),
    status: z
      .enum(['active', 'inactive', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'])
      .optional(),
    search: z.string().optional(),
  }),
});

export const reviewActionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reviewNotes: z.string().optional() }),
});

export const rejectCourseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    rejectionReason: z.string().min(3),
    reviewNotes: z.string().optional(),
  }),
});

export const addStaffSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    userId: z.string().uuid(),
    role: z.enum(['TEACHING_ASSISTANT', 'CONTENT_REVIEWER']),
  }),
});

export const staffIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    staffId: z.string().uuid(),
  }),
});

