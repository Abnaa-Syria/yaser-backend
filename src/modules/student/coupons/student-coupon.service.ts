import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import type { Coupon } from '@prisma/client';

type CouponWithEligibility = Coupon & {
  eligibleCourses: { courseId: string }[];
};

export function applyCouponDiscount(originalPrice: number, coupon: Pick<Coupon, 'discountType' | 'discountValue'>) {
  const base = Number(originalPrice) || 0;
  const value = Number(coupon.discountValue) || 0;
  if (base <= 0) return 0;
  if (coupon.discountType === 'PERCENTAGE') {
    return Math.max(0, Math.round(base - (base * value) / 100));
  }
  return Math.max(0, Math.round(base - value));
}

/**
 * Validate a coupon code for a specific target
 */
export const validateCoupon = async (studentId: string, code: string, targetType: string, targetId: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: { eligibleCourses: { select: { courseId: true } } },
  }) as CouponWithEligibility | null;

  // 1. Existence and Active Check
  if (!coupon || !coupon.isActive) {
    throw new AppError('Invalid or inactive coupon code.', 400);
  }

  // 2. Expiry Check
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    throw new AppError('This coupon has expired.', 400);
  }

  // 3. Start Date Check
  if (coupon.startsAt && new Date() < coupon.startsAt) {
    throw new AppError('This coupon is not yet active.', 400);
  }

  // 4. Max Overall Uses Check
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('This coupon has reached its maximum usage limit.', 400);
  }

  // 5. Max Uses Per User Check
  const userUsageCount = await prisma.couponUsage.count({
    where: { couponId: coupon.id, userId: studentId }
  });

  if (userUsageCount >= coupon.maxUsesPerUser) {
    throw new AppError('You have already reached the maximum usage limit for this coupon.', 400);
  }

  // 6. Target Type Check
  if (coupon.appliesTo !== 'BOTH') {
    if (coupon.appliesTo === 'SUBSCRIPTION' && targetType !== 'SUBSCRIPTION' && targetType !== 'PACKAGE') {
      throw new AppError('This coupon is only valid for subscriptions.', 400);
    }
    if (coupon.appliesTo === 'COURSE' && targetType !== 'COURSE' && targetType !== 'COHORT' && targetType !== 'CLASS') {
      throw new AppError('This coupon is only valid for courses.', 400);
    }
  }

  if (
    (targetType === 'COURSE' || targetType === 'COHORT' || targetType === 'CLASS') &&
    coupon.eligibleCourses.length > 0 &&
    !coupon.eligibleCourses.some((row) => row.courseId === targetId)
  ) {
    throw new AppError('This coupon does not apply to this course.', 400);
  }

  return coupon;
};
