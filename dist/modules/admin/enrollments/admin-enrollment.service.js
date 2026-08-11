import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { userHasRoleName } from '../../../utils/role-query.js';
async function computeEnrollmentStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, thisMonth, completed, revenueAgg] = await Promise.all([
        prisma.coursePurchase.count(),
        prisma.coursePurchase.count({
            where: { purchasedAt: { gte: startOfMonth } },
        }),
        prisma.coursePurchase.count({
            where: { isCompleted: true },
        }),
        prisma.payment.aggregate({
            where: { status: 'PAID', courseId: { not: null } },
            _sum: { amount: true },
        }),
    ]);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const revenueFromEnrollments = Math.round(Number(revenueAgg._sum.amount ?? 0) * 100) / 100;
    return {
        total,
        thisMonth,
        completionRate,
        revenueFromEnrollments,
    };
}
/**
 * List all course purchases (enrollments) with pagination and stats.
 */
export const getAllEnrollments = async (raw) => {
    const pageNum = Number(raw.page) || 1;
    const limitNum = Math.min(Number(raw.limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;
    const and = [];
    if (raw.courseId)
        and.push({ courseId: raw.courseId });
    if (raw.studentId)
        and.push({ studentId: raw.studentId });
    if (raw.status === 'completed')
        and.push({ isCompleted: true });
    if (raw.status === 'active')
        and.push({ isCompleted: false });
    if (raw.dateFrom || raw.dateTo) {
        const purchasedAt = {};
        if (raw.dateFrom)
            purchasedAt.gte = new Date(raw.dateFrom);
        if (raw.dateTo) {
            const end = new Date(raw.dateTo);
            end.setHours(23, 59, 59, 999);
            purchasedAt.lte = end;
        }
        and.push({ purchasedAt });
    }
    if (raw.search?.trim()) {
        const q = raw.search.trim();
        and.push({
            OR: [
                { student: { fullName: { contains: q } } },
                { student: { email: { contains: q } } },
                { course: { title: { contains: q } } },
            ],
        });
    }
    const where = and.length > 0 ? { AND: and } : {};
    const [purchases, total, stats] = await Promise.all([
        prisma.coursePurchase.findMany({
            where,
            skip,
            take: limitNum,
            include: {
                student: {
                    select: { id: true, fullName: true, email: true, avatar: true },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        price: true,
                        type: true,
                        instructor: { select: { id: true, fullName: true, email: true, avatar: true } },
                    },
                },
            },
            orderBy: { purchasedAt: 'desc' },
        }),
        prisma.coursePurchase.count({ where }),
        computeEnrollmentStats(),
    ]);
    const keys = purchases.map((p) => ({ studentId: p.studentId, courseId: p.courseId }));
    let paymentSums = new Map();
    if (keys.length > 0) {
        const payments = await prisma.payment.findMany({
            where: {
                status: 'PAID',
                OR: keys.map((k) => ({ studentId: k.studentId, courseId: k.courseId })),
            },
            select: { studentId: true, courseId: true, amount: true },
        });
        paymentSums = new Map();
        for (const p of payments) {
            if (!p.courseId)
                continue;
            const key = `${p.studentId}:${p.courseId}`;
            paymentSums.set(key, (paymentSums.get(key) ?? 0) + Number(p.amount));
        }
    }
    return {
        enrollments: purchases.map((p) => {
            const payKey = `${p.studentId}:${p.course.id}`;
            const amountPaid = Math.round((paymentSums.get(payKey) ?? 0) * 100) / 100;
            const coursePrice = p.course.price != null ? Number(p.course.price) : null;
            const statusLabel = p.isCompleted ? 'completed' : 'active';
            return {
                id: p.id,
                studentId: p.studentId,
                courseId: p.course.id,
                joinedAt: p.purchasedAt,
                enrolledAt: p.purchasedAt,
                isCompleted: p.isCompleted,
                progressPercentage: p.progressPercentage,
                completedLessonsCount: p.completedLessonsCount,
                amountPaid,
                coursePrice,
                status: statusLabel,
                student: p.student,
                course: {
                    id: p.course.id,
                    title: p.course.title,
                    thumbnail: p.course.thumbnail,
                    type: p.course.type,
                },
                instructor: p.course.instructor,
            };
        }),
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
        },
        stats,
    };
};
/**
 * Manually grant a student lifetime access to a course.
 */
export const createEnrollment = async (data) => {
    const { studentId, courseId } = data;
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true },
    });
    if (!course)
        throw new AppError('Course not found.', 404);
    const student = await prisma.user.findFirst({
        where: { id: studentId, ...userHasRoleName('STUDENT') },
    });
    if (!student)
        throw new AppError('Student not found or invalid role.', 404);
    const existing = await prisma.coursePurchase.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing)
        throw new AppError('Student already owns this course.', 400);
    const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.coursePurchase.create({
            data: {
                studentId,
                courseId,
            },
            include: {
                course: { select: { title: true } },
                student: { select: { fullName: true } },
            },
        });
        return purchase;
    });
    return result;
};
/**
 * Manually adjust the expiry date (or clear it) of an existing enrollment.
 */
export const updateEnrollmentExpiry = async (id, expiresAt) => {
    const existing = await prisma.coursePurchase.findUnique({ where: { id } });
    if (!existing)
        throw new AppError('Enrollment not found.', 404);
    const updated = await prisma.coursePurchase.update({
        where: { id },
        data: { expiresAt: expiresAt ? new Date(expiresAt) : null },
        include: {
            course: { select: { id: true, title: true } },
            student: { select: { id: true, fullName: true, email: true } },
        },
    });
    return updated;
};
/**
 * Revoke a student's manually-granted (or purchased) access to a course.
 */
export const revokeEnrollment = async (id) => {
    const existing = await prisma.coursePurchase.findUnique({ where: { id } });
    if (!existing)
        throw new AppError('Enrollment not found.', 404);
    await prisma.coursePurchase.delete({ where: { id } });
    return { id, revoked: true };
};
//# sourceMappingURL=admin-enrollment.service.js.map