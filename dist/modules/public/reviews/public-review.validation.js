import { z } from 'zod';
const intQuery = (fallback, max = 100) => z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
    const n = typeof val === 'number' ? val : val != null && String(val).trim() !== '' ? Number.parseInt(String(val), 10) : fallback;
    if (!Number.isFinite(n) || n < 1)
        return fallback;
    return Math.min(max, Math.floor(n));
});
export const getReviewsSchema = z.object({
    params: z.object({
        courseId: z.string().uuid(),
    }),
    query: z.object({
        page: intQuery(1, 10000),
        limit: intQuery(10, 100),
    }),
});
//# sourceMappingURL=public-review.validation.js.map