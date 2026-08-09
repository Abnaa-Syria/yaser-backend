import { z } from 'zod';
export const slugParamSchema = z.object({
    params: z.object({
        slug: z.string().min(1),
    }),
});
//# sourceMappingURL=public-category.validation.js.map