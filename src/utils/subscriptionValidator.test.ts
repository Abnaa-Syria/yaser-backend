import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();

vi.mock('../prisma.js', () => ({
  prisma: {
    coursePurchase: {
      findUnique,
    },
  },
}));

const { hasCourseAccess } = await import('./subscriptionValidator.js');

describe('course access validation', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('denies access when no purchase exists', async () => {
    findUnique.mockResolvedValue(null);

    await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(false);
  });

  it('denies access when purchase is expired', async () => {
    findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() - 1000) });

    await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(false);
  });

  it('allows access for unexpired or lifetime purchases', async () => {
    findUnique.mockResolvedValueOnce({ expiresAt: new Date(Date.now() + 1000) });
    await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(true);

    findUnique.mockResolvedValueOnce({ expiresAt: null });
    await expect(hasCourseAccess('student-1', 'course-1')).resolves.toBe(true);
  });
});
