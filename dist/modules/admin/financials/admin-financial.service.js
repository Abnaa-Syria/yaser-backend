import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
/**
 * Create a new package
 */
export const createPackage = async (data) => {
    const pkg = await prisma.package.create({
        data: {
            name: data.name,
            level: data.level,
            priceMonthly: data.priceMonthly,
            priceYearly: data.priceYearly,
            features: data.features,
            isRecommended: !!data.isRecommended,
            isActive: data.isActive !== undefined ? data.isActive : true
        }
    });
    return pkg;
};
export const getAllPackages = async () => {
    return await prisma.package.findMany({ orderBy: { level: 'asc' } });
};
export const getPackageById = async (id) => {
    const pkg = await prisma.package.findUnique({ where: { id } });
    if (!pkg)
        throw new AppError('Package not found', 404);
    return pkg;
};
/**
 * Update package
 */
export const updatePackage = async (id, data) => {
    const updated = await prisma.package.update({
        where: { id },
        data
    });
    return updated;
};
/**
 * Delete package
 */
export const deletePackage = async (id) => {
    await prisma.package.delete({ where: { id } });
    return { id, deleted: true };
};
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
    const payments = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            student: { select: { fullName: true, email: true } },
            course: { select: { title: true } },
            class: { select: { title: true } },
            subscription: { include: { package: { select: { name: true } } } }
        }
    });
    return payments;
};
export const getPaymentById = async (id) => {
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            student: { select: { id: true, fullName: true, avatar: true, email: true } },
            course: { select: { id: true, title: true } },
            class: { select: { id: true, title: true } },
            subscription: { include: { package: true } }
        }
    });
    if (!payment)
        throw new AppError('Payment not found', 404);
    return payment;
};
/**
 * Approve a pending payment and activate access
 */
export const approvePayment = async (paymentId) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { subscription: true }
    });
    if (!payment)
        throw new AppError('Payment not found.', 404);
    if (payment.status !== 'PENDING')
        throw new AppError(`Cannot approve payment with status: ${payment.status}`, 400);
    return await prisma.$transaction(async (tx) => {
        // 1. Update Payment
        await tx.payment.update({
            where: { id: paymentId },
            data: { status: 'PAID', paidAt: new Date() }
        });
        // 2. Activate Subscription if applicable
        if (payment.subscriptionId && payment.subscription) {
            const days = payment.subscription.isYearly ? 365 : 30;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);
            await tx.userSubscription.update({
                where: { id: payment.subscriptionId },
                data: { status: 'ACTIVE', startDate: new Date(), endDate }
            });
        }
        // 3. Create Enrollment for Course
        if (payment.courseId) {
            await tx.enrollment.create({
                data: {
                    studentId: payment.studentId,
                    courseId: payment.courseId
                }
            });
        }
        // 4. Create Enrollment for Class
        if (payment.classId) {
            await tx.enrollment.create({
                data: {
                    studentId: payment.studentId,
                    classId: payment.classId
                }
            });
        }
        return { id: paymentId, approved: true };
    });
};
/**
 * Reject a payment
 */
export const rejectPayment = async (paymentId) => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment)
        throw new AppError('Payment not found.', 404);
    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: paymentId },
            data: { status: 'FAILED' }
        });
        if (payment.subscriptionId) {
            await tx.userSubscription.update({
                where: { id: payment.subscriptionId },
                data: { status: 'CANCELED' }
            });
        }
    });
    return { id: paymentId, rejected: true };
};
export const updatePaymentStatus = async (paymentId, status) => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment)
        throw new AppError('Payment not found.', 404);
    const data = { status };
    if (status === 'PAID') {
        data.paidAt = new Date();
    }
    return prisma.payment.update({
        where: { id: paymentId },
        data,
    });
};
//# sourceMappingURL=admin-financial.service.js.map