import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export function applyCouponDiscount(originalPrice, coupon) {
    const base = Number(originalPrice) || 0;
    const value = Number(coupon.discountValue) || 0;
    if (base <= 0)
        return 0;
    if (coupon.discountType === 'PERCENTAGE') {
        return Math.max(0, Math.round(base - (base * value) / 100));
    }
    return Math.max(0, Math.round(base - value));
}
/**
 * Validate a coupon code for a specific target
 */
export const validateCoupon = async (studentId, code, targetType, targetId, db = prisma) => {
    const coupon = (await db.coupon.findUnique({
        where: { code: code.toUpperCase() },
        include: { eligibleCourses: { select: { courseId: true } } },
    }));
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
    const userUsageCount = await db.couponUsage.count({
        where: { couponId: coupon.id, userId: studentId },
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
    if ((targetType === 'COURSE' || targetType === 'COHORT' || targetType === 'CLASS') &&
        coupon.eligibleCourses.length > 0 &&
        !coupon.eligibleCourses.some((row) => row.courseId === targetId)) {
        throw new AppError('This coupon does not apply to this course.', 400);
    }
    return coupon;
};
/** Record coupon redemption once a payment is fulfilled (idempotent). */
export async function recordCouponUsageTx(tx, params) {
    const code = params.couponCode.trim().toUpperCase();
    if (!code)
        return;
    const coupon = await tx.coupon.findUnique({ where: { code } });
    if (!coupon)
        return;
    const existing = await tx.couponUsage.findUnique({
        where: {
            couponId_userId_targetId: {
                couponId: coupon.id,
                userId: params.studentId,
                targetId: params.targetId,
            },
        },
    });
    if (existing)
        return;
    await tx.couponUsage.create({
        data: {
            couponId: coupon.id,
            userId: params.studentId,
            targetType: params.targetType,
            targetId: params.targetId,
            discountApplied: Math.max(0, Number(params.basePrice) - Number(params.finalAmount)),
        },
    });
    await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
    });
}
/** Undo coupon redemption when a fulfilled payment is refunded. */
export async function reverseCouponUsageTx(tx, params) {
    const code = params.couponCode.trim().toUpperCase();
    if (!code)
        return;
    const coupon = await tx.coupon.findUnique({ where: { code } });
    if (!coupon)
        return;
    const usage = await tx.couponUsage.findUnique({
        where: {
            couponId_userId_targetId: {
                couponId: coupon.id,
                userId: params.studentId,
                targetId: params.targetId,
            },
        },
    });
    if (!usage)
        return;
    await tx.couponUsage.delete({ where: { id: usage.id } });
    if (coupon.usedCount > 0) {
        await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { decrement: 1 } },
        });
    }
}
export function readPriceSnapshot(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    return raw;
}
/** Validate + persist coupon usage after a payment is fulfilled. */
export async function maybeRecordCouponForPaymentTx(tx, payment) {
    const snap = readPriceSnapshot(payment.priceSnapshot);
    const couponCode = snap?.couponCode?.trim();
    if (!couponCode)
        return;
    const targetType = payment.coursePackageId ? 'PACKAGE' : payment.courseId ? 'COURSE' : null;
    const targetId = payment.coursePackageId || payment.courseId;
    if (!targetType || !targetId)
        return;
    await validateCoupon(payment.studentId, couponCode, targetType, targetId, tx);
    await recordCouponUsageTx(tx, {
        studentId: payment.studentId,
        couponCode,
        targetType,
        targetId,
        basePrice: Number(snap?.basePrice) || payment.amount,
        finalAmount: Number(snap?.finalAmount) ?? payment.amount,
    });
}
/** Restore coupon quota when a fulfilled payment is refunded. */
export async function maybeReverseCouponForPaymentTx(tx, payment) {
    const snap = readPriceSnapshot(payment.priceSnapshot);
    const couponCode = snap?.couponCode?.trim();
    if (!couponCode)
        return;
    const targetId = payment.coursePackageId || payment.courseId;
    if (!targetId)
        return;
    await reverseCouponUsageTx(tx, {
        studentId: payment.studentId,
        couponCode,
        targetId,
    });
}
//# sourceMappingURL=student-coupon.service.js.map