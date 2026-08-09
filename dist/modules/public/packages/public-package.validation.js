import { z } from 'zod';
export const packageIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid package ID format'),
    }),
});
//# sourceMappingURL=public-package.validation.js.map