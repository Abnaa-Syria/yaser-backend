import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { createNotification } from '../../notifications/notification.service.js';
import { creditInstructorForPaidPaymentTx } from './payment-wallet-credit.service.js';
import { fulfillPrivateSessionPaymentTx } from '../../student/financials/student-financial.service.js';
import { platformFeatures } from '../../../config/features.config.js';
import { calculateAccessExpiresAt, durationDaysFromParts } from '../../payments/access-window.js';
import { sendTemplatedEmail } from '../../../utils/mail.js';
import { APP_BRAND } from '../../../config/brand.config.js';
function paymentCreditShape(payment) {
    return {
        id: payment.id,
        amount: payment.amount,
        courseId: payment.courseId,
        availabilityId: payment.availabilityId,
    };
}
/**
 * List all payments with filtering
 */
export const getAllPayments = async (query) => {
    const { status, studentId } = query;
    const where = {};
    if (status)
        where.status = status;
    if (studentId)
        where.studentId = studentId;
    return prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            student: { select: { fullName: true, email: true } },
            course: { select: { title: true } },
            coursePackage: { select: { id: true, title: true, titleAr: true } },
        },
    });
};
export const getPaymentById = async (id) => {
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            student: { select: { id: true, fullName: true, avatar: true, email: true } },
            course: { select: { id: true, title: true } },
            coursePackage: { select: { id: true, title: true, titleAr: true } },
        },
    });
    if (!payment)
        throw new AppError('Payment not found', 404);
    return payment;
};
async function fulfillPaidPaymentTx(tx, payment, accessStartsAt = new Date()) {
    if (platformFeatures.wallet && (payment.courseId || payment.availabilityId)) {
        await creditInstructorForPaidPaymentTx(tx, paymentCreditShape(payment));
    }
    let purchased = false;
    // 1. Course Purchase with Pricing Tiers (Term/Year/Lifetime)
    if (payment.courseId && !payment.availabilityId) {
        let expiresAt = null;
        if (payment.pricingTierId) {
            const tier = await tx.coursePricingTier.findUnique({
                where: { id: payment.pricingTierId },
            });
            if (tier) {
                expiresAt = calculateAccessExpiresAt(accessStartsAt, durationDaysFromParts(tier.durationDays, tier.durationValue, tier.durationUnit));
            }
        }
        const existing = await tx.coursePurchase.findUnique({
            where: { studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId } },
        });
        if (!existing) {
            await tx.coursePurchase.create({
                data: {
                    studentId: payment.studentId,
                    courseId: payment.courseId,
                    paymentId: payment.id,
                    pricingTierId: payment.pricingTierId || null,
                    accessStartsAt,
                    activatedAt: accessStartsAt,
                    expiresAt,
                },
            });
        }
        else {
            await tx.coursePurchase.update({
                where: { id: existing.id },
                data: {
                    paymentId: payment.id,
                    pricingTierId: payment.pricingTierId || null,
                    accessStartsAt,
                    activatedAt: accessStartsAt,
                    expiresAt,
                },
            });
        }
        purchased = true;
    }
    // 2. Private Session
    if (payment.availabilityId) {
        await fulfillPrivateSessionPaymentTx(tx, payment.id);
    }
    // 3. Course Package / Bundle Purchase
    if (payment.coursePackageId) {
        let expiresAt = null;
        if (payment.coursePackagePricingTierId) {
            const tier = await tx.coursePackagePricingTier.findUnique({
                where: { id: payment.coursePackagePricingTierId },
            });
            if (tier) {
                expiresAt = calculateAccessExpiresAt(accessStartsAt, durationDaysFromParts(tier.durationDays, tier.durationValue, tier.durationUnit));
            }
        }
        const items = await tx.coursePackageItem.findMany({
            where: { packageId: payment.coursePackageId },
        });
        for (const item of items) {
            const existing = await tx.coursePurchase.findUnique({
                where: { studentId_courseId: { studentId: payment.studentId, courseId: item.courseId } },
            });
            if (!existing) {
                await tx.coursePurchase.create({
                    data: {
                        studentId: payment.studentId,
                        courseId: item.courseId,
                        paymentId: payment.id,
                        accessStartsAt,
                        activatedAt: accessStartsAt,
                        expiresAt,
                    },
                });
            }
            else {
                await tx.coursePurchase.update({
                    where: { id: existing.id },
                    data: {
                        paymentId: payment.id,
                        accessStartsAt,
                        activatedAt: accessStartsAt,
                        expiresAt,
                    },
                });
            }
        }
        const existingPkgPurchase = await tx.coursePackagePurchase.findUnique({
            where: {
                studentId_packageId: {
                    studentId: payment.studentId,
                    packageId: payment.coursePackageId,
                },
            },
        });
        if (!existingPkgPurchase) {
            await tx.coursePackagePurchase.create({
                data: {
                    studentId: payment.studentId,
                    packageId: payment.coursePackageId,
                    paymentId: payment.id,
                    pricingTierId: payment.coursePackagePricingTierId || null,
                    accessStartsAt,
                    activatedAt: accessStartsAt,
                    expiresAt,
                },
            });
        }
        else {
            await tx.coursePackagePurchase.update({
                where: { id: existingPkgPurchase.id },
                data: {
                    paymentId: payment.id,
                    pricingTierId: payment.coursePackagePricingTierId || null,
                    accessStartsAt,
                    activatedAt: accessStartsAt,
                    expiresAt,
                },
            });
        }
        purchased = true;
    }
    return purchased;
}
async function calculatePaymentAccessExpiresAtTx(tx, payment, accessStartsAt) {
    if (payment.pricingTierId) {
        const tier = await tx.coursePricingTier.findUnique({ where: { id: payment.pricingTierId } });
        if (tier) {
            return calculateAccessExpiresAt(accessStartsAt, durationDaysFromParts(tier.durationDays, tier.durationValue, tier.durationUnit));
        }
    }
    if (payment.coursePackagePricingTierId) {
        const tier = await tx.coursePackagePricingTier.findUnique({
            where: { id: payment.coursePackagePricingTierId },
        });
        if (tier) {
            return calculateAccessExpiresAt(accessStartsAt, durationDaysFromParts(tier.durationDays, tier.durationValue, tier.durationUnit));
        }
    }
    return null;
}
/**
 * Approve a pending payment and activate access
 */
export const approvePayment = async (paymentId, reviewerId, adminNote) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            student: { select: { id: true, fullName: true, email: true } },
            course: { select: { title: true } },
            coursePackage: { select: { title: true } },
        },
    });
    if (!payment)
        throw new AppError('Payment not found.', 404);
    if (payment.status !== 'PENDING') {
        throw new AppError(`Cannot approve payment with status: ${payment.status}`, 400);
    }
    const result = await prisma.$transaction(async (tx) => {
        const accessStartsAt = new Date();
        const accessExpiresAt = await calculatePaymentAccessExpiresAtTx(tx, payment, accessStartsAt);
        await tx.payment.update({
            where: { id: paymentId },
            data: {
                status: 'PAID',
                paidAt: accessStartsAt,
                activatedAt: accessStartsAt,
                accessStartsAt,
                accessExpiresAt,
                reviewedById: reviewerId || null,
                reviewedAt: accessStartsAt,
                adminNote: adminNote?.trim() || null,
            },
        });
        const purchased = await fulfillPaidPaymentTx(tx, payment, accessStartsAt);
        const message = purchased
            ? `Your payment of ${payment.amount} has been approved. You now have lifetime access to this course.`
            : payment.availabilityId
                ? `Your payment of ${payment.amount} has been approved. Your private session is confirmed.`
                : `Your payment of ${payment.amount} has been approved.`;
        await createNotification(payment.studentId, 'Payment Approved', message, 'GENERAL', tx);
        return { id: paymentId, approved: true, purchased };
    });
    const productTitle = payment.course?.title || payment.coursePackage?.title || 'your purchase';
    const learnUrl = `${APP_BRAND.siteUrl}/student/classes`;
    void sendTemplatedEmail({
        to: payment.student.email,
        templateName: 'PAYMENT_APPROVED',
        vars: {
            student_name: payment.student.fullName,
            name: payment.student.fullName,
            paymentId: payment.id,
            amount: payment.amount,
            course_title: productTitle,
            product_title: productTitle,
            learn_url: learnUrl,
            site_url: APP_BRAND.siteUrl,
        },
        fallbackSubject: `${APP_BRAND.name} — Payment approved`,
        fallbackHtml: `
      <p>Hi ${payment.student.fullName},</p>
      <p>Your payment of <strong>${payment.amount}</strong> for <strong>${productTitle}</strong> was approved.</p>
      <p>You can start learning here: <a href="${learnUrl}">${learnUrl}</a></p>
      <p>— ${APP_BRAND.name}</p>
    `,
    }).catch((err) => {
        console.error('[mail] PAYMENT_APPROVED failed', err);
    });
    return result;
};
/**
 * Reject a payment
 */
export const rejectPayment = async (paymentId, reviewerId, rejectionReason) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            student: { select: { id: true, fullName: true, email: true } },
            course: { select: { title: true } },
            coursePackage: { select: { title: true } },
        },
    });
    if (!payment)
        throw new AppError('Payment not found.', 404);
    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: paymentId },
            data: {
                status: 'FAILED',
                reviewedById: reviewerId || null,
                reviewedAt: new Date(),
                rejectionReason: rejectionReason?.trim() || null,
            },
        });
        if (payment.availabilityId) {
            await tx.instructorAvailability.updateMany({
                where: { id: payment.availabilityId, status: 'BOOKED' },
                data: { status: 'AVAILABLE' },
            });
        }
        await createNotification(payment.studentId, 'Payment Rejected', rejectionReason?.trim()
            ? `Your payment was rejected: ${rejectionReason.trim()}`
            : 'Your recent payment attempt was rejected. Please contact support.', 'GENERAL', tx);
    });
    const productTitle = payment.course?.title || payment.coursePackage?.title || 'your purchase';
    const reason = rejectionReason?.trim() || 'Please contact support for details.';
    void sendTemplatedEmail({
        to: payment.student.email,
        templateName: 'PAYMENT_REJECTED',
        vars: {
            student_name: payment.student.fullName,
            name: payment.student.fullName,
            paymentId: payment.id,
            amount: payment.amount,
            course_title: productTitle,
            product_title: productTitle,
            rejection_reason: reason,
            contact_email: APP_BRAND.contactEmail,
            site_url: APP_BRAND.siteUrl,
        },
        fallbackSubject: `${APP_BRAND.name} — Payment not approved`,
        fallbackHtml: `
      <p>Hi ${payment.student.fullName},</p>
      <p>Your payment of <strong>${payment.amount}</strong> for <strong>${productTitle}</strong> was not approved.</p>
      <p>Reason: ${reason}</p>
      <p>Need help? Contact us at <a href="mailto:${APP_BRAND.contactEmail}">${APP_BRAND.contactEmail}</a>.</p>
      <p>— ${APP_BRAND.name}</p>
    `,
    }).catch((err) => {
        console.error('[mail] PAYMENT_REJECTED failed', err);
    });
    return { id: paymentId, rejected: true };
};
export const updatePaymentStatus = async (paymentId, status) => {
    return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            throw new AppError('Payment not found.', 404);
        const wasPaid = payment.status === 'PAID';
        const accessStartsAt = new Date();
        const data = { status };
        if (status === 'PAID' && !payment.paidAt) {
            data.paidAt = accessStartsAt;
            data.activatedAt = accessStartsAt;
            data.accessStartsAt = accessStartsAt;
            data.accessExpiresAt = await calculatePaymentAccessExpiresAtTx(tx, payment, accessStartsAt);
        }
        const updated = await tx.payment.update({ where: { id: paymentId }, data });
        if (status === 'PAID' && !wasPaid) {
            await fulfillPaidPaymentTx(tx, updated, data.accessStartsAt || accessStartsAt);
        }
        return updated;
    });
};
//# sourceMappingURL=admin-payment.service.js.map