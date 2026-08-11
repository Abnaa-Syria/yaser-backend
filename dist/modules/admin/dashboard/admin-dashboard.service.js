import { Prisma, ContentStatus } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { userHasRoleName } from '../../../utils/role-query.js';
import { notDeleted } from '../../../utils/soft-delete.js';
export const getStats = async () => {
    const [totalStudents, totalInstructors, revenueData, pendingPayouts, activeCourses, pendingReviewCourses, openTickets,] = await Promise.all([
        prisma.user.count({ where: notDeleted(userHasRoleName('STUDENT')) }),
        prisma.user.count({ where: notDeleted(userHasRoleName('INSTRUCTOR')) }),
        prisma.payment.aggregate({
            where: { status: 'PAID' },
            _sum: { amount: true },
        }),
        prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
        prisma.course.count({ where: notDeleted({ isActive: true, status: ContentStatus.APPROVED }) }),
        prisma.course.count({ where: notDeleted({ status: ContentStatus.PENDING_REVIEW }) }),
        prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);
    return {
        totalStudents,
        totalInstructors,
        totalRevenue: revenueData._sum.amount || 0,
        pendingPayouts,
        activeCourses,
        pendingReviewCourses,
        openTickets,
    };
};
function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function monthBuckets(count) {
    const now = new Date();
    const buckets = [];
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
            monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleString('en-US', { month: 'short' }),
            start: startOfMonth(d),
            end: endOfMonth(d),
        });
    }
    return buckets;
}
function paymentEffectiveDate(p) {
    return p.paidAt ?? p.createdAt;
}
export const getOverview = async () => {
    const buckets = monthBuckets(6);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;
    const [totalStudents, totalInstructors, revenueAgg, totalActiveCourses, paidInRange, topCoursesRaw, recentPurchases, recentPayments, recentAuditLogs, recentSessions,] = await Promise.all([
        prisma.user.count({ where: userHasRoleName('STUDENT') }),
        prisma.user.count({ where: userHasRoleName('INSTRUCTOR') }),
        prisma.payment.aggregate({
            where: { status: 'PAID' },
            _sum: { amount: true },
        }),
        prisma.course.count({ where: { isActive: true } }),
        prisma.payment.findMany({
            where: {
                status: 'PAID',
                OR: [
                    { paidAt: { gte: rangeStart, lte: rangeEnd } },
                    { AND: [{ paidAt: null }, { createdAt: { gte: rangeStart, lte: rangeEnd } }] },
                ],
            },
            select: { amount: true, paidAt: true, createdAt: true },
        }),
        prisma.$queryRaw(Prisma.sql `
        SELECT c.id AS courseId, c.title AS title, COUNT(cp.id) AS enrollmentCount
        FROM course_purchases cp
        INNER JOIN courses c ON c.id = cp.courseId
        WHERE c.isActive = 1
        GROUP BY c.id, c.title
        ORDER BY enrollmentCount DESC
        LIMIT 5
      `),
        prisma.coursePurchase.findMany({
            take: 8,
            orderBy: { purchasedAt: 'desc' },
            include: {
                student: { select: { fullName: true, email: true } },
                course: { select: { title: true } },
            },
        }),
        prisma.payment.findMany({
            where: { status: 'PAID' },
            take: 8,
            orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                student: { select: { fullName: true } },
                course: { select: { title: true } },
            },
        }),
        prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { fullName: true } }
            }
        }),
        prisma.userSession.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                student: { select: { fullName: true } },
                device: { select: { deviceName: true, os: true } }
            }
        })
    ]);
    const revenueTrend = buckets.map((b) => {
        let total = 0;
        for (const p of paidInRange) {
            const at = paymentEffectiveDate(p);
            if (at >= b.start && at <= b.end)
                total += p.amount;
        }
        return { monthKey: b.monthKey, label: b.label, total: Math.round(total * 100) / 100 };
    });
    const topCoursesByEnrollments = topCoursesRaw.map((row) => ({
        courseId: row.courseId,
        title: row.title,
        enrollmentCount: Number(row.enrollmentCount),
    }));
    const activity = [
        ...recentPurchases.map((p) => ({
            id: `enrollment:${p.id}`,
            type: 'enrollment',
            at: p.purchasedAt.toISOString(),
            studentName: p.student.fullName,
            label: p.course.title,
        })),
        ...recentPayments.map((p) => ({
            id: `payment:${p.id}`,
            type: 'payment',
            at: paymentEffectiveDate(p).toISOString(),
            studentName: p.student.fullName,
            label: p.course?.title || 'Payment',
            amount: p.amount,
        })),
    ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 5);
    // Merge dynamic activity from AuditLog and UserSession
    const auditActivity = [
        ...recentAuditLogs.map((log) => {
            let message = `${log.user?.fullName || 'User'} performed action: ${log.action}`;
            if (log.action === 'USER_TOGGLE_ACTIVE') {
                const details = log.details;
                message = `${log.user?.fullName || 'Admin'} ${details?.isActive ? 'activated' : 'deactivated'} user account`;
            }
            else if (log.action === 'USER_SOFT_DELETED') {
                message = `${log.user?.fullName || 'Admin'} deleted user account`;
            }
            else if (log.action === 'USER_PERMISSION_GRANTED') {
                const details = log.details;
                message = `${log.user?.fullName || 'Admin'} granted permission "${details?.permission}"`;
            }
            else if (log.action === 'USER_PERMISSION_REVOKED') {
                message = `${log.user?.fullName || 'Admin'} revoked user permission`;
            }
            else if (log.action === 'USER_FORCE_LOGOUT') {
                message = `${log.user?.fullName || 'Admin'} forced logout on user`;
            }
            return {
                id: log.id,
                message,
                type: 'audit',
                at: log.createdAt,
            };
        }),
        ...recentSessions.map((sess) => {
            const deviceLabel = sess.device ? ` on ${sess.device.deviceName} (${sess.device.os})` : '';
            return {
                id: sess.id,
                message: `${sess.student?.fullName || 'Student'} initiated a live session connection${deviceLabel}`,
                type: 'session',
                at: sess.createdAt,
            };
        })
    ]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, 3)
        .map((item) => ({
        id: item.id,
        message: item.message,
        type: item.type,
        at: item.at.toISOString()
    }));
    const finalAuditLogs = auditActivity;
    return {
        summary: {
            totalRevenue: Math.round((revenueAgg._sum.amount || 0) * 100) / 100,
            totalStudents,
            totalInstructors,
            totalActiveCourses,
        },
        revenueTrend,
        topCoursesByEnrollments,
        recentActivity: activity,
        recentAuditLogs: finalAuditLogs,
    };
};
//# sourceMappingURL=admin-dashboard.service.js.map