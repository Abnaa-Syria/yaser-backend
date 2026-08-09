import { z } from 'zod';
export const validateCouponSchema = z.object({
    body: z.object({
        code: z.string().min(3, 'Coupon code is required'),
        targetType: z.enum(['SUBSCRIPTION', 'CLASS', 'COURSE']),
        targetId: z.string().uuid('Invalid target ID format'),
    }),
});
//# sourceMappingURL=student-coupon.validation.js.map