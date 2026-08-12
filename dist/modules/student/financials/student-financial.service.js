import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { applyCouponDiscount, validateCoupon, maybeRecordCouponForPaymentTx } from '../coupons/student-coupon.service.js';
import { calculateAccessExpiresAt, durationDaysFromParts } from '../../payments/access-window.js';
import { PAYMENT_CONFIG } from '../../../config/payment.config.js';
function isPurchaseAccessActive(expiresAt) {
    if (!expiresAt)
        return true;
    return expiresAt.getTime() > Date.now();
}
/**
 * Course lifetime purchase: pending payment at course.price.
 * Admin approval creates CoursePurchase and triggers commission allocation.
 */
export const createCoursePurchasePayment = async (studentId, courseId, data) => {
    return prisma.$transaction(async (tx) => {
        const course = await tx.course.findFirst({
            where: { id: courseId, deletedAt: null, isActive: true },
            select: {
                id: true,
                title: true,
                price: true,
                isLifetimePurchasable: true,
            },
        });
        if (!course)
            throw new AppError('Course not found.', 404);
        const existingPurchase = await tx.coursePurchase.findUnique({
            where: { studentId_courseId: { studentId, courseId } },
        });
        if (existingPurchase && isPurchaseAccessActive(existingPurchase.expiresAt)) {
            throw new AppError('You already own this course.', 409);
        }
        const pendingExisting = await tx.payment.findFirst({
            where: {
                studentId,
                courseId,
                availabilityId: null,
                subscriptionId: null,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });
        if (pendingExisting) {
            return { payment: pendingExisting, reusedPending: true };
        }
        let basePrice = Number(course.price);
        let pricingTier = null;
        if (data.pricingTierId) {
            pricingTier = await tx.coursePricingTier.findFirst({
                where: { id: data.pricingTierId, courseId, isActive: true },
            });
            if (!pricingTier) {
                throw new AppError('Selected pricing tier not found or inactive.', 404);
            }
            basePrice = Number(pricingTier.price);
        }
        else {
            if (!course.isLifetimePurchasable) {
                throw new AppError('This course is not available for individual purchase.', 400);
            }
        }
        if (Number.isNaN(basePrice) || basePrice < 0) {
            throw new AppError('Course price is not configured.', 400);
        }
        let amount = basePrice;
        if (data.couponCode) {
            const coupon = await validateCoupon(studentId, data.couponCode, 'COURSE', courseId);
            amount = applyCouponDiscount(basePrice, coupon);
        }
        if (Number.isNaN(amount) || amount < 0) {
            throw new AppError('Course price is not configured.', 400);
        }
        // 1. Free Course: Instant Enrollment
        if (amount === 0) {
            const accessStartsAt = new Date();
            let expiresAt = null;
            if (pricingTier && pricingTier.durationDays) {
                expiresAt = new Date(accessStartsAt.getTime() + pricingTier.durationDays * 24 * 60 * 60 * 1000);
            }
            const payment = await tx.payment.create({
                data: {
                    studentId,
                    courseId,
                    pricingTierId: data.pricingTierId || null,
                    amount: 0,
                    paymentMethod: 'FREE',
                    receiptUrl: 'INSTANT_FREE_ENROLLMENT',
                    status: 'PAID',
                    paidAt: accessStartsAt,
                    activatedAt: accessStartsAt,
                    accessStartsAt,
                    accessExpiresAt: expiresAt,
                    priceSnapshot: {
                        courseId,
                        courseTitle: course.title,
                        pricingTierId: data.pricingTierId || null,
                        basePrice,
                        finalAmount: amount,
                        couponCode: data.couponCode || null,
                    },
                },
            });
            await tx.coursePurchase.upsert({
                where: { studentId_courseId: { studentId, courseId } },
                update: {
                    paymentId: payment.id,
                    pricingTierId: data.pricingTierId || null,
                    accessStartsAt: payment.accessStartsAt,
                    activatedAt: payment.activatedAt,
                    expiresAt,
                },
                create: {
                    studentId,
                    courseId,
                    paymentId: payment.id,
                    pricingTierId: data.pricingTierId || null,
                    accessStartsAt: payment.accessStartsAt,
                    activatedAt: payment.activatedAt,
                    expiresAt,
                },
            });
            await maybeRecordCouponForPaymentTx(tx, {
                studentId,
                amount,
                courseId,
                priceSnapshot: payment.priceSnapshot,
            });
            return { payment, reusedPending: false, enrolledInstantly: true };
        }
        // 2. Paid Course Flow
        if (!data.receiptUrl) {
            throw new AppError('Receipt URL is required for paid purchases.', 400);
        }
        const payment = await tx.payment.create({
            data: {
                studentId,
                courseId,
                pricingTierId: data.pricingTierId || null,
                amount,
                paymentMethod: data.paymentMethod,
                receiptUrl: data.receiptUrl,
                studentNote: data.studentNote?.trim() || null,
                paymentDestinationSnapshot: {
                    paymentMethod: data.paymentMethod,
                    ...PAYMENT_CONFIG,
                },
                priceSnapshot: {
                    courseId,
                    courseTitle: course.title,
                    pricingTierId: data.pricingTierId || null,
                    basePrice,
                    finalAmount: amount,
                    couponCode: data.couponCode || null,
                },
                status: 'PENDING',
            },
        });
        return { payment, reusedPending: false, enrolledInstantly: false };
    });
};
export const createPackagePurchasePayment = async (studentId, packageId, data) => {
    return prisma.$transaction(async (tx) => {
        const coursePackage = await tx.coursePackage.findFirst({
            where: { id: packageId, isActive: true, publishStatus: 'PUBLISHED' },
            include: {
                courses: true,
            },
        });
        if (!coursePackage)
            throw new AppError('Package not found.', 404);
        if (coursePackage.courses.length === 0) {
            throw new AppError('Package does not contain courses.', 400);
        }
        const pendingExisting = await tx.payment.findFirst({
            where: {
                studentId,
                coursePackageId: packageId,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });
        if (pendingExisting)
            return { payment: pendingExisting, reusedPending: true };
        let pricingTier = null;
        let basePrice = Number(coursePackage.price);
        if (data.pricingTierId) {
            pricingTier = await tx.coursePackagePricingTier.findFirst({
                where: { id: data.pricingTierId, packageId, isActive: true },
            });
            if (!pricingTier)
                throw new AppError('Selected package pricing tier not found or inactive.', 404);
            basePrice = Number(pricingTier.price);
        }
        let amount = basePrice;
        if (data.couponCode) {
            const coupon = await validateCoupon(studentId, data.couponCode, 'PACKAGE', packageId);
            amount = applyCouponDiscount(basePrice, coupon);
        }
        const accessStartsAt = new Date();
        const expiresAt = pricingTier
            ? calculateAccessExpiresAt(accessStartsAt, durationDaysFromParts(pricingTier.durationDays, pricingTier.durationValue, pricingTier.durationUnit))
            : null;
        if (amount === 0) {
            const payment = await tx.payment.create({
                data: {
                    studentId,
                    coursePackageId: packageId,
                    coursePackagePricingTierId: data.pricingTierId || null,
                    amount: 0,
                    paymentMethod: 'FREE',
                    receiptUrl: 'INSTANT_FREE_PACKAGE_ENROLLMENT',
                    status: 'PAID',
                    paidAt: accessStartsAt,
                    activatedAt: accessStartsAt,
                    accessStartsAt,
                    accessExpiresAt: expiresAt,
                    priceSnapshot: {
                        packageId,
                        packageTitle: coursePackage.title,
                        pricingTierId: data.pricingTierId || null,
                        basePrice,
                        finalAmount: amount,
                        couponCode: data.couponCode || null,
                    },
                },
            });
            await tx.coursePackagePurchase.upsert({
                where: { studentId_packageId: { studentId, packageId } },
                update: {
                    paymentId: payment.id,
                    pricingTierId: data.pricingTierId || null,
                    accessStartsAt,
                    activatedAt: accessStartsAt,
                    expiresAt,
                },
                create: {
                    studentId,
                    packageId,
                    paymentId: payment.id,
                    pricingTierId: data.pricingTierId || null,
                    accessStartsAt,
                    activatedAt: accessStartsAt,
                    expiresAt,
                },
            });
            for (const item of coursePackage.courses) {
                await tx.coursePurchase.upsert({
                    where: { studentId_courseId: { studentId, courseId: item.courseId } },
                    update: { paymentId: payment.id, accessStartsAt, activatedAt: accessStartsAt, expiresAt },
                    create: { studentId, courseId: item.courseId, paymentId: payment.id, accessStartsAt, activatedAt: accessStartsAt, expiresAt },
                });
            }
            await maybeRecordCouponForPaymentTx(tx, {
                studentId,
                amount,
                coursePackageId: packageId,
                priceSnapshot: payment.priceSnapshot,
            });
            return { payment, reusedPending: false, enrolledInstantly: true };
        }
        if (!data.receiptUrl) {
            throw new AppError('Receipt URL is required for paid package purchases.', 400);
        }
        const payment = await tx.payment.create({
            data: {
                studentId,
                coursePackageId: packageId,
                coursePackagePricingTierId: data.pricingTierId || null,
                amount,
                paymentMethod: data.paymentMethod,
                receiptUrl: data.receiptUrl,
                studentNote: data.studentNote?.trim() || null,
                paymentDestinationSnapshot: { paymentMethod: data.paymentMethod, ...PAYMENT_CONFIG },
                priceSnapshot: {
                    packageId,
                    packageTitle: coursePackage.title,
                    pricingTierId: data.pricingTierId || null,
                    basePrice,
                    finalAmount: amount,
                    couponCode: data.couponCode || null,
                },
                status: 'PENDING',
            },
        });
        return { payment, reusedPending: false, enrolledInstantly: false };
    });
};
/**
 * Private session: pending payment for an availability slot.
 */
export const createPrivateSessionPayment = async (studentId, availabilityId, data) => {
    return prisma.$transaction(async (tx) => {
        const slot = await tx.instructorAvailability.findUnique({
            where: { id: availabilityId },
            include: {
                instructor: { select: { id: true, fullName: true } },
            },
        });
        if (!slot)
            throw new AppError('Availability slot not found.', 404);
        if (slot.status !== 'AVAILABLE') {
            throw new AppError('This slot is no longer available.', 409);
        }
        const pendingExisting = await tx.payment.findFirst({
            where: {
                studentId,
                availabilityId,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });
        if (pendingExisting) {
            return { payment: pendingExisting, reusedPending: true };
        }
        const amount = slot.price > 0 ? slot.price : 0;
        if (amount <= 0) {
            throw new AppError('Session price is not configured for this slot.', 400);
        }
        await tx.instructorAvailability.update({
            where: { id: availabilityId },
            data: { status: 'BOOKED' },
        });
        const payment = await tx.payment.create({
            data: {
                studentId,
                availabilityId,
                amount,
                paymentMethod: data.paymentMethod,
                receiptUrl: data.receiptUrl,
                status: 'PENDING',
            },
        });
        return { payment, reusedPending: false, slot };
    });
};
/** Fulfill private session payment: mark availability booked after admin approval. */
export const fulfillPrivateSessionPaymentTx = async (tx, paymentId) => {
    const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        select: {
            id: true,
            availabilityId: true,
            status: true,
        },
    });
    if (!payment?.availabilityId)
        return null;
    const slot = await tx.instructorAvailability.findUnique({
        where: { id: payment.availabilityId },
    });
    if (!slot)
        return null;
    if (slot.status !== 'BOOKED') {
        await tx.instructorAvailability.update({
            where: { id: slot.id },
            data: { status: 'BOOKED' },
        });
    }
    return { availabilityId: slot.id };
};
/**
 * Get student's payments
 */
export const getMyPayments = async (studentId) => {
    return prisma.payment.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        include: {
            course: { select: { title: true } },
            coursePackage: { select: { id: true, title: true, titleAr: true } },
            pricingTier: { select: { id: true, name: true, nameAr: true, price: true, durationDays: true } },
            coursePackagePricingTier: { select: { id: true, name: true, nameAr: true, price: true, durationDays: true } },
        },
    });
};
/**
 * Get student's purchased courses (my courses).
 */
export const getMyPurchasedCourses = async (studentId) => {
    const purchases = await prisma.coursePurchase.findMany({
        where: { studentId },
        orderBy: { purchasedAt: 'desc' },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    thumbnail: true,
                    type: true,
                    price: true,
                    instructor: { select: { id: true, fullName: true, avatar: true } },
                },
            },
        },
    });
    return purchases.map((p) => ({
        purchaseId: p.id,
        courseId: p.courseId,
        course: p.course,
        purchasedAt: p.purchasedAt,
        accessStartsAt: p.accessStartsAt,
        activatedAt: p.activatedAt,
        expiresAt: p.expiresAt,
        pricingTierId: p.pricingTierId,
        paymentId: p.paymentId,
        accessStatus: p.expiresAt && p.expiresAt.getTime() <= Date.now()
            ? 'EXPIRED'
            : p.accessStartsAt && p.accessStartsAt.getTime() > Date.now()
                ? 'UPCOMING'
                : 'ACTIVE',
        progressPercentage: p.progressPercentage,
        completedLessonsCount: p.completedLessonsCount,
        isCompleted: p.isCompleted,
    }));
};
export const getMyPackageBalances = async (studentId) => {
    const purchases = await prisma.coursePackagePurchase.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        include: {
            package: {
                include: {
                    courses: {
                        include: {
                            course: { select: { id: true, title: true, thumbnail: true, type: true } },
                        },
                    },
                },
            },
            pricingTier: true,
            payment: true,
        },
    });
    return purchases.map((purchase) => ({
        purchaseId: purchase.id,
        packageId: purchase.packageId,
        package: purchase.package,
        pricingTier: purchase.pricingTier,
        paymentId: purchase.paymentId,
        paymentStatus: purchase.payment?.status ?? null,
        purchasedAt: purchase.createdAt,
        accessStartsAt: purchase.accessStartsAt,
        activatedAt: purchase.activatedAt,
        expiresAt: purchase.expiresAt,
        accessStatus: purchase.expiresAt && purchase.expiresAt.getTime() <= Date.now()
            ? 'EXPIRED'
            : purchase.accessStartsAt && purchase.accessStartsAt.getTime() > Date.now()
                ? 'UPCOMING'
                : 'ACTIVE',
    }));
};
export const getMySubscriptions = getMyPackageBalances;
//# sourceMappingURL=student-financial.service.js.map