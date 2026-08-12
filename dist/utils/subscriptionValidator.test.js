import { beforeEach, describe, expect, it, vi } from 'vitest';
const findUniquePurchase = vi.fn();
const findFirstSubscription = vi.fn();
const findFirstCourse = vi.fn();
vi.mock('../prisma.js', () => ({
    prisma: {
        coursePurchase: {
            findUnique: findUniquePurchase,
        },
        userSubscription: {
            findFirst: findFirstSubscription,
        },
        course: {
            findFirst: findFirstCourse,
        },
    },
}));
const { hasCourseAccess, hasActiveSubscription } = await import('./subscriptionValidator.js');
describe('course access validation', () => {
    beforeEach(() => {
        findUniquePurchase.mockReset();
        findFirstSubscription.mockReset();
        findFirstCourse.mockReset();
        findFirstSubscription.mockResolvedValue(null);
        findFirstCourse.mockResolvedValue(null);
    });
    it('denies access when no purchase exists', async () => {
        findUniquePurchase.mockResolvedValue(null);
        await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(false);
    });
    it('denies access when purchase is expired', async () => {
        findUniquePurchase.mockResolvedValue({ expiresAt: new Date(Date.now() - 1000) });
        await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(false);
    });
    it('allows access for unexpired or lifetime purchases', async () => {
        findUniquePurchase.mockResolvedValueOnce({ expiresAt: new Date(Date.now() + 1000) });
        await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(true);
        findUniquePurchase.mockResolvedValueOnce({ expiresAt: null });
        await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(true);
    });
    it('allows access through an active platform subscription', async () => {
        findUniquePurchase.mockResolvedValue(null);
        findFirstSubscription.mockResolvedValue({ id: 'sub-1' });
        findFirstCourse.mockResolvedValue({ id: 'course-1' });
        await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(true);
        await expect(hasActiveSubscription('student-1')).resolves.toBe(true);
    });
});
//# sourceMappingURL=subscriptionValidator.test.js.map