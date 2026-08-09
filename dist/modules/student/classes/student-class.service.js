import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
/**
 * List live sessions for courses the student has purchased (plus private sessions).
 */
export const getMyClasses = async (studentId) => {
    const purchases = await prisma.coursePurchase.findMany({
        where: { studentId },
        select: { courseId: true, purchasedAt: true, course: { select: { id: true, title: true, type: true } } },
        orderBy: { purchasedAt: 'desc' },
    });
    const courseIds = purchases.map((p) => p.courseId);
    // Fetch student profile academicLevel
    const userProfile = await prisma.user.findUnique({
        where: { id: studentId },
        select: { academicLevel: true }
    });
    const studentLevel = userProfile?.academicLevel;
    // Retrieve standalone sessions and course sessions
    const groupWhere = {
        type: 'GROUP',
        OR: [
            { courseId: { in: courseIds } },
            { isFreeForAll: true },
            { courseId: null }
        ]
    };
    const [groupSessions, privateSessions, standalonePayments] = await Promise.all([
        prisma.liveSession.findMany({
            where: groupWhere,
            orderBy: { startTime: 'asc' },
            include: {
                instructor: { select: { fullName: true } },
                course: { select: { title: true } },
            },
        }),
        prisma.liveSession.findMany({
            where: { studentId, type: 'PRIVATE' },
            orderBy: { startTime: 'asc' },
            include: {
                instructor: { select: { fullName: true } },
            },
        }),
        prisma.payment.findMany({
            where: { studentId, status: 'PAID', liveSessionId: { not: null } },
            select: { liveSessionId: true, paidAt: true }
        })
    ]);
    const purchaseByCourseId = new Map(purchases.map((p) => [p.courseId, p]));
    const paymentBySessionId = new Map(standalonePayments.map((p) => [p.liveSessionId, p]));
    // Filter group sessions in-memory according to target academic levels
    const filteredGroupSessions = groupSessions.filter((session) => {
        // 1. If it's linked to student's purchased courses
        if (session.courseId && courseIds.includes(session.courseId))
            return true;
        // 2. If it is marked free for all
        if (session.isFreeForAll)
            return true;
        // 3. If targetLevels contains student's academic level or "GENERAL"
        if (session.targetLevels && Array.isArray(session.targetLevels)) {
            const levels = session.targetLevels;
            if (levels.includes('GENERAL'))
                return true;
            if (studentLevel && levels.includes(studentLevel))
                return true;
            return false;
        }
        return true; // fallback if no targetLevels configured
    });
    const groupItems = filteredGroupSessions.map((session) => ({
        id: session.id,
        title: session.title || session.course?.title || 'Live session',
        status: session.status,
        type: session.type,
        courseId: session.courseId,
        scheduledAt: session.startTime,
        durationMinutes: Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000),
        meetingUrl: session.meetingUrl,
        instructor: session.instructor,
        course: session.course,
        isFreeForAll: session.isFreeForAll,
        price: session.price,
        targetLevels: session.targetLevels,
        joinedAt: session.courseId
            ? (purchaseByCourseId.get(session.courseId)?.purchasedAt ?? null)
            : (paymentBySessionId.get(session.id)?.paidAt ?? null),
    }));
    const privateItems = privateSessions.map((session) => ({
        id: session.id,
        title: session.title || 'Private 1-on-1 Session',
        status: session.status,
        type: session.type,
        courseId: session.courseId,
        scheduledAt: session.startTime,
        durationMinutes: Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000),
        meetingUrl: session.meetingUrl,
        instructor: session.instructor,
        course: null,
        joinedAt: session.createdAt,
    }));
    return [...groupItems, ...privateItems];
};
export const getClassDetails = async (studentId, sessionId) => {
    const session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: {
            instructor: { select: { id: true, fullName: true, avatar: true, bio: true } },
            course: { select: { id: true, title: true } },
        },
    });
    if (!session)
        throw new AppError('Session not found.', 404);
    if (session.isFreeForAll || session.price === null || session.price <= 0) {
        // Access granted to all registered students
    }
    else if (session.type === 'PRIVATE') {
        if (session.studentId !== studentId)
            throw new AppError('You are not enrolled in this session.', 403);
    }
    else if (session.courseId) {
        const purchase = await prisma.coursePurchase.findUnique({
            where: { studentId_courseId: { studentId, courseId: session.courseId } },
        });
        if (!purchase)
            throw new AppError('You are not enrolled in this course.', 403);
    }
    else {
        // Standalone paid session
        const payment = await prisma.payment.findFirst({
            where: { studentId, liveSessionId: sessionId, status: 'PAID' },
        });
        if (!payment)
            throw new AppError('You have not booked a seat for this session.', 403);
    }
    return session;
};
export const enrollInClass = async (_studentId, _classId) => {
    throw new AppError('Direct class enrollment is no longer supported. Purchase the course for lifetime access.', 410);
};
export const unenrollFromClass = async (_studentId, _classId) => {
    throw new AppError('Class unenrollment is no longer supported.', 410);
};
//# sourceMappingURL=student-class.service.js.map