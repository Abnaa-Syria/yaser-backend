import { prisma } from '../../../prisma.js';
import { countInstructorUpcomingSessions, fetchInstructorUpcomingSessions, } from './instructor-upcoming-sessions.js';
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
export const getInstructorOverview = async (instructorId) => {
    const buckets = monthBuckets(6);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;
    const wallet = await prisma.wallet.findUnique({
        where: { instructorId },
        select: { id: true, balance: true, totalEarned: true },
    });
    const earningTxns = wallet
        ? await prisma.walletTransaction.findMany({
            where: {
                walletId: wallet.id,
                type: 'EARNING',
                createdAt: { gte: rangeStart, lte: rangeEnd },
            },
            select: { amount: true, createdAt: true },
        })
        : [];
    const [user, activeCourseCount, upcomingSessionCount, distinctStudents, coursesWithCounts, recentPurchases, recentPayments, totalReviews, upcomingSessionsRaw,] = await Promise.all([
        prisma.user.findUnique({
            where: { id: instructorId },
            select: { averageRating: true },
        }),
        prisma.course.count({
            where: { instructorId, isActive: true },
        }),
        countInstructorUpcomingSessions(instructorId),
        prisma.coursePurchase.groupBy({
            by: ['studentId'],
            where: { course: { instructorId } },
            _count: { studentId: true },
        }),
        prisma.course.findMany({
            where: { instructorId },
            select: {
                id: true,
                title: true,
                type: true,
                isActive: true,
                _count: { select: { purchases: true } },
            },
        }),
        prisma.coursePurchase.findMany({
            where: { course: { instructorId } },
            take: 8,
            orderBy: { purchasedAt: 'desc' },
            include: {
                student: { select: { fullName: true } },
                course: { select: { title: true } },
            },
        }),
        prisma.payment.findMany({
            where: { status: 'PAID', course: { instructorId } },
            take: 8,
            orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                student: { select: { fullName: true } },
                course: { select: { title: true } },
            },
        }),
        prisma.instructorReview.count({ where: { instructorId } }),
        fetchInstructorUpcomingSessions(instructorId, 5),
    ]);
    const upcomingSessionsList = upcomingSessionsRaw.map((s) => ({
        id: s.id,
        source: s.source,
        sessionId: null,
        lessonId: s.lessonId ?? null,
        title: s.title,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        meetingUrl: s.meetingUrl,
        status: s.status,
        type: null,
        studentName: null,
        course: s.course,
    }));
    const earningsTrend = buckets.map((b) => {
        let total = 0;
        for (const tx of earningTxns) {
            if (tx.createdAt >= b.start && tx.createdAt <= b.end)
                total += tx.amount;
        }
        return { monthKey: b.monthKey, label: b.label, total: Math.round(total * 100) / 100 };
    });
    const topCoursesByEnrollments = [...coursesWithCounts]
        .sort((a, b) => b._count.purchases - a._count.purchases)
        .slice(0, 5)
        .map((c) => ({
        courseId: c.id,
        title: c.title,
        type: c.type,
        isActive: c.isActive,
        enrollmentCount: c._count.purchases,
    }));
    const activity = [
        ...recentPurchases.map((e) => ({
            id: `enrollment:${e.id}`,
            type: 'enrollment',
            at: e.purchasedAt.toISOString(),
            studentName: e.student.fullName,
            label: e.course.title,
        })),
        ...recentPayments.map((p) => ({
            id: `payment:${p.id}`,
            type: 'payment',
            at: (p.paidAt ?? p.createdAt).toISOString(),
            studentName: p.student.fullName,
            label: p.course?.title || 'Payment',
            amount: p.amount,
        })),
    ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 5);
    return {
        summary: {
            totalStudents: distinctStudents.length,
            activeCourses: activeCourseCount,
            upcomingSessions: upcomingSessionCount,
            totalCourses: coursesWithCounts.length,
            totalEarnings: Math.round((wallet?.totalEarned ?? 0) * 100) / 100,
            walletBalance: Math.round((wallet?.balance ?? 0) * 100) / 100,
            averageRating: user?.averageRating ?? 0,
            totalReviews,
        },
        earningsTrend,
        topCoursesByEnrollments,
        upcomingSessionsList,
        recentActivity: activity,
    };
};
//# sourceMappingURL=instructor-dashboard.service.js.map