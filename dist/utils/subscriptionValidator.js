import { prisma } from '../prisma.js';
import { AppError } from './AppError.js';
function isAccessActive(expiresAt) {
    if (!expiresAt)
        return true;
    return expiresAt.getTime() > Date.now();
}
/** Lifetime or term purchase grants access to a single course. */
export const hasLifetimePurchase = async (studentId, courseId) => {
    const purchase = await prisma.coursePurchase.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (!purchase)
        return false;
    return isAccessActive(purchase.expiresAt);
};
/** Active platform subscription grants access to all published courses. */
export const hasActiveSubscription = async (studentId) => {
    const now = new Date();
    const subscription = await prisma.userSubscription.findFirst({
        where: {
            studentId,
            status: 'ACTIVE',
            startDate: { lte: now },
            endDate: { gt: now },
        },
        select: { id: true },
    });
    return Boolean(subscription);
};
async function courseEligibleForSubscriptionAccess(courseId) {
    const course = await prisma.course.findFirst({
        where: {
            id: courseId,
            deletedAt: null,
            isActive: true,
            status: 'APPROVED',
            publishStatus: 'PUBLISHED',
        },
        select: { id: true },
    });
    return Boolean(course);
}
export const hasCourseAccess = async (studentId, courseId) => {
    if (await hasLifetimePurchase(studentId, courseId))
        return true;
    if (await hasActiveSubscription(studentId)) {
        return courseEligibleForSubscriptionAccess(courseId);
    }
    return false;
};
export const requireCourseAccess = async (studentId, courseId) => {
    const allowed = await hasCourseAccess(studentId, courseId);
    if (!allowed) {
        throw new AppError('Access denied. Purchase this course or activate a platform subscription for access.', 403);
    }
};
/** @deprecated Use course purchase or UserSubscription instead. */
export const consumePackageCredit = async (_studentId, _feature) => {
    throw new AppError('Platform subscriptions are not available. Please purchase the course directly.', 403);
};
export const validateSubscriptionLimits = consumePackageCredit;
//# sourceMappingURL=subscriptionValidator.js.map