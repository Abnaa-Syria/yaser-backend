import { z } from 'zod';

const optionalUuid = z.preprocess(
  (val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val),
  z.string().uuid().optional()
);

export const listEnrollmentsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    courseId: optionalUuid,
    studentId: optionalUuid,
    dateFrom: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
    dateTo: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
    status: z.preprocess(
      (val) => (val === '' || val === 'all' ? undefined : val),
      z.enum(['active', 'completed']).optional()
    ),
    search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  }),
});

export const createEnrollmentSchema = z.object({
  body: z
    .object({
      studentId: z.string().uuid('Invalid student ID format'),
      courseId: z.string().uuid('Invalid course ID format'),
      /** lifetime | months | tier */
      accessMode: z.enum(['lifetime', 'months', 'tier']).default('lifetime'),
      pricingTierId: z.string().uuid().optional().nullable(),
      durationMonths: z.number().int().min(1).max(60).optional().nullable(),
      amountPaid: z.number().nonnegative().optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
      /** If true and student already has access, extend/update instead of failing */
      renewIfExists: z.boolean().optional(),
    })
    .superRefine((body, ctx) => {
      if (body.accessMode === 'months' && !(body.durationMonths && body.durationMonths > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['durationMonths'],
          message: 'durationMonths is required when accessMode is months',
        });
      }
      if (body.accessMode === 'tier' && !body.pricingTierId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pricingTierId'],
          message: 'pricingTierId is required when accessMode is tier',
        });
      }
    }),
});

export const enrollmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid enrollment ID format'),
  }),
});

export const updateEnrollmentExpirySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid enrollment ID format'),
  }),
  body: z.object({
    expiresAt: z.string().datetime().nullable().optional(),
  }),
});
