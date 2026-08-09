import { z } from 'zod';
export const verifySchema = z.object({
    params: z.object({
        serialNumber: z.string().min(1),
    }),
});
//# sourceMappingURL=public-certificate.validation.js.map