import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid subscription ID format'),
  }),
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    planId: z.string().uuid().optional(),
    packageId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELED', 'PENDING_PAYMENT']).optional(),
    isYearly: z.boolean().optional(),
  }).refine((b) => !!(b.planId || b.packageId), {
    message: 'planId or packageId is required',
    path: ['planId'],
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELED', 'PENDING_PAYMENT']),
  }),
});

export const createEnrollmentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    courseId: z.string().uuid(),
  }),
});

