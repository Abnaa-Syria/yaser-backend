import { z } from 'zod';
const cohortTypeEnum = z.enum(['LIVE', 'RECORDED']);
const cohortStatusEnum = z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']);
export const classIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid class ID format'),
    }),
});
export const listClassesSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(10),
        instructorId: z.string().uuid().optional(),
        courseId: z.string().uuid().optional(),
        type: cohortTypeEnum.optional(),
    }),
});
const cohortBodyBase = z.object({
    name: z.string().min(1).max(200),
    type: cohortTypeEnum,
    status: cohortStatusEnum.optional(),
    courseId: z.string().uuid('Invalid course ID'),
    instructorId: z.string().uuid('Invalid instructor ID'),
    startDate: z.string().datetime({ message: 'Invalid ISO start date' }).optional(),
    endDate: z.string().datetime({ message: 'Invalid ISO end date' }).optional(),
    /** Legacy alias — mapped to startDate in service when startDate omitted */
    scheduledAt: z.string().datetime({ message: 'Invalid ISO scheduled date' }).optional(),
    price: z.coerce.number().nonnegative(),
});
export const createClassSchema = z.object({
    body: cohortBodyBase.refine((b) => !!(b.startDate || b.scheduledAt), {
        message: 'startDate or scheduledAt is required',
        path: ['startDate'],
    }),
});
export const updateClassSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid class ID format'),
    }),
    body: z
        .object({
        name: z.string().min(1).max(200).optional(),
        type: cohortTypeEnum.optional(),
        status: cohortStatusEnum.optional(),
        courseId: z.string().uuid().optional(),
        instructorId: z.string().uuid().optional(),
        startDate: z.string().datetime().optional().nullable(),
        endDate: z.string().datetime().optional().nullable(),
        scheduledAt: z.string().datetime().optional().nullable(),
        price: z.coerce.number().nonnegative().optional(),
    })
        .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required' }),
});
//# sourceMappingURL=admin-class.validation.js.map