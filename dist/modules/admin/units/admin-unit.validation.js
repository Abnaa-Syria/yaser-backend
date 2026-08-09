import { z } from 'zod';
export const unitIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid unit ID format'),
    }),
});
export const createUnitSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(200),
        order: z.number().int().min(1),
        courseId: z.string().uuid('Invalid course ID format'),
    }),
});
export const updateUnitSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid unit ID format'),
    }),
    body: z.object({
        title: z.string().min(1, 'Title is required').max(200).optional(),
        order: z.number().int().min(1).optional(),
    }),
});
export const listUnitsSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
        courseId: z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=admin-unit.validation.js.map