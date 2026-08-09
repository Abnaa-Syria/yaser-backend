import { z } from 'zod';

export const couponIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid coupon ID format'),
  }),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20),
    description: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().positive(),
    appliesTo: z.enum(['SUBSCRIPTION', 'CLASS', 'BOTH']),
    maxUses: z.number().int().positive().optional().nullable(),
    maxUsesPerUser: z.number().int().positive().optional().default(1),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
    courseIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid coupon ID format'),
  }),
  body: z.object({
    code: z.string().min(3).max(20).optional(),
    description: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().positive().optional(),
    appliesTo: z.enum(['SUBSCRIPTION', 'CLASS', 'BOTH']).optional(),
    maxUses: z.number().int().positive().optional().nullable(),
    maxUsesPerUser: z.number().int().positive().optional(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
    courseIds: z.array(z.string().uuid()).optional(),
  }),
});
