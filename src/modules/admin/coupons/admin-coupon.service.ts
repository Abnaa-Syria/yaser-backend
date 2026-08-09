import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

/**
 * Create a new coupon
 */
export const createCoupon = async (data: any) => {
  const { courseIds, ...couponData } = data;

  const coupon = await prisma.coupon.create({
    data: {
      code: couponData.code.toUpperCase(),
      description: couponData.description,
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      appliesTo: couponData.appliesTo,
      maxUses: couponData.maxUses,
      maxUsesPerUser: couponData.maxUsesPerUser || 1,
      startsAt: couponData.startsAt ? new Date(couponData.startsAt) : undefined,
      expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : undefined,
      isActive: couponData.isActive !== undefined ? couponData.isActive : true,
      ...(Array.isArray(courseIds) && courseIds.length > 0
        ? {
            eligibleCourses: {
              create: courseIds.map((courseId: string) => ({ courseId })),
            },
          }
        : {}),
    },
    include: { eligibleCourses: true },
  });
  return coupon;
};

/**
 * List all coupons with pagination
 */
export const getCoupons = async (query: any) => {
  const { page = '1', limit = '10' } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [coupons, total] = await prisma.$transaction([
    prisma.coupon.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        eligibleCourses: { select: { courseId: true } },
      },
    }),
    prisma.coupon.count()
  ]);

  return {
    coupons,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

export const getCouponById = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      eligibleCourses: { include: { course: { select: { id: true, title: true } } } },
      usages: {
        take: 10,
        orderBy: { usedAt: 'desc' },
      },
    },
  });
  if (!coupon) throw new AppError('Coupon not found', 404);
  return coupon;
};


/**
 * Update coupon
 */
export const updateCoupon = async (id: string, data: any) => {
  const { courseIds, ...couponData } = data;

  const coupon = await prisma.$transaction(async (tx) => {
    const updated = await tx.coupon.update({
      where: { id },
      data: {
        ...couponData,
        code: couponData.code ? couponData.code.toUpperCase() : undefined,
        startsAt: couponData.startsAt ? new Date(couponData.startsAt) : undefined,
        expiresAt: couponData.expiresAt !== undefined
          ? (couponData.expiresAt ? new Date(couponData.expiresAt) : null)
          : undefined,
      },
    });

    if (Array.isArray(courseIds)) {
      await tx.couponCourse.deleteMany({ where: { couponId: id } });
      if (courseIds.length > 0) {
        await tx.couponCourse.createMany({
          data: courseIds.map((courseId: string) => ({ couponId: id, courseId })),
        });
      }
    }

    return tx.coupon.findUnique({
      where: { id },
      include: {
        eligibleCourses: { include: { course: { select: { id: true, title: true } } } },
      },
    });
  });

  return coupon;
};

/**
 * Delete coupon
 */
export const deleteCoupon = async (id: string) => {
  await prisma.coupon.delete({ where: { id } });
  return { id, deleted: true };
};

/**
 * List usage history for a specific coupon
 */
export const getCouponUsageHistory = async (id: string) => {
  const usages = await prisma.couponUsage.findMany({
    where: { couponId: id },
    orderBy: { usedAt: 'desc' },
    include: {
      user: {
        select: { id: true, email: true, fullName: true },
      },
    },
  });
  return usages;
};
