import { z } from 'zod';
export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        slug: z.string().min(2).max(100),
        description: z.string().optional(),
        parentId: z.string().uuid().nullable().optional(),
        icon: z.string().nullable().optional(),
    }),
});
export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        slug: z.string().min(2).max(100).optional(),
        description: z.string().optional(),
        parentId: z.string().uuid().nullable().optional(),
        icon: z.string().nullable().optional(),
    }),
});
export const categoryIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});
export const listCategoriesSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
        search: z.string().optional(),
    }),
});
//# sourceMappingURL=admin-category.validation.js.map