import { z } from 'zod';
const optionalUuid = z.preprocess((val) => (val === '' || val === 'null' || val === 'undefined' ? undefined : val), z.string().uuid().optional());
export const listEnrollmentsSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
        courseId: optionalUuid,
        studentId: optionalUuid,
        dateFrom: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
        dateTo: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
        status: z.preprocess((val) => (val === '' || val === 'all' ? undefined : val), z.enum(['active', 'completed']).optional()),
        search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
    }),
});
export const createEnrollmentSchema = z.object({
    body: z.object({
        studentId: z.string().uuid('Invalid student ID format'),
        courseId: z.string().uuid('Invalid course ID format'),
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
//# sourceMappingURL=admin-enrollment.validation.js.map