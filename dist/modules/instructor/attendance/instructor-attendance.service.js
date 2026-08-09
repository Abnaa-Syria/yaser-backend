import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { emitAttendanceUpdated, emitSessionAttendanceRefresh } from '../../../socket/index.js';
function groupCount(row) {
    const c = row._count;
    if (!c || c === true)
        return 0;
    return c._all ?? 0;
}
export const listSessionsForAttendance = async (instructorId, query) => {
    const pageNum = Number(query.page) || 1;
    const limitNum = Math.min(Number(query.limit) || 30, 100);
    const skip = (pageNum - 1) * limitNum;
    const and = [
        { type: 'GROUP' },
        { course: { instructorId, deletedAt: null } },
    ];
    if (query.courseId)
        and.push({ courseId: query.courseId });
    if (query.status)
        and.push({ status: query.status });
    const where = { AND: and };
    const [sessions, total] = await Promise.all([
        prisma.liveSession.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { startTime: 'desc' },
            select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                status: true,
                courseId: true,
                course: { select: { id: true, title: true } },
                _count: { select: { attendances: true } },
            },
        }),
        prisma.liveSession.count({ where }),
    ]);
    const courseIds = [...new Set(sessions.map((s) => s.courseId).filter((id) => Boolean(id)))];
    const enrollments = courseIds.length > 0
        ? await prisma.coursePurchase.groupBy({
            by: ['courseId'],
            where: { courseId: { in: courseIds } },
            orderBy: { courseId: 'asc' },
            _count: { _all: true },
        })
        : [];
    const enrollMap = new Map(enrollments.map((row) => [row.courseId, groupCount(row)]));
    return {
        sessions: sessions.map((s) => ({
            id: s.id,
            title: s.title,
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
            courseId: s.courseId,
            courseTitle: s.course?.title ?? '—',
            presentCount: s._count.attendances,
            enrolledCount: s.courseId ? enrollMap.get(s.courseId) || 0 : 0,
        })),
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
        },
    };
};
export const getSessionAttendanceDetail = async (instructorId, sessionId) => {
    const session = await prisma.liveSession.findFirst({
        where: {
            id: sessionId,
            type: 'GROUP',
            course: { instructorId, deletedAt: null },
        },
        include: {
            course: { select: { id: true, title: true } },
            attendances: {
                include: {
                    student: { select: { id: true, fullName: true, email: true, avatar: true } },
                },
                orderBy: { joinedAt: 'asc' },
            },
        },
    });
    if (!session)
        throw new AppError('Session not found or you do not have access.', 404);
    if (!session.courseId || !session.course) {
        throw new AppError('Session course is missing.', 404);
    }
    const [enrollments, enrolledCount] = await Promise.all([
        prisma.coursePurchase.findMany({
            where: { courseId: session.courseId },
            include: {
                student: { select: { id: true, fullName: true, email: true, avatar: true } },
            },
            orderBy: { purchasedAt: 'asc' },
        }),
        prisma.coursePurchase.count({ where: { courseId: session.courseId } }),
    ]);
    const attendanceByStudent = new Map(session.attendances.map((a) => [a.studentId, a]));
    const roster = enrollments.map((enrollment) => {
        const record = attendanceByStudent.get(enrollment.studentId);
        if (record) {
            return {
                studentId: enrollment.studentId,
                student: record.student,
                joinedAt: record.joinedAt,
                leftAt: record.leftAt,
                durationMinutes: record.durationMinutes,
                status: record.leftAt ? 'LEFT' : 'PRESENT',
            };
        }
        return {
            studentId: enrollment.studentId,
            student: enrollment.student,
            joinedAt: null,
            leftAt: null,
            durationMinutes: 0,
            status: 'ABSENT',
        };
    });
    const presentCount = roster.filter((row) => row.status === 'PRESENT' || row.status === 'LEFT').length;
    const totalDuration = roster.reduce((sum, row) => sum + (row.durationMinutes || 0), 0);
    const attendedRows = roster.filter((row) => row.status !== 'ABSENT');
    const avgDurationMinutes = attendedRows.length
        ? Math.round(totalDuration / attendedRows.length)
        : 0;
    return {
        session: {
            id: session.id,
            title: session.title,
            startTime: session.startTime,
            endTime: session.endTime,
            status: session.status,
            courseId: session.courseId,
            courseTitle: session.course.title,
        },
        summary: {
            presentCount,
            enrolledCount,
            absentCount: Math.max(0, enrolledCount - presentCount),
            attendanceRate: enrolledCount ? Math.round((presentCount / enrolledCount) * 100) : 0,
            avgDurationMinutes,
        },
        roster,
    };
};
export const markSessionAttendance = async (instructorId, sessionId, studentId, present) => {
    const session = await prisma.liveSession.findFirst({
        where: {
            id: sessionId,
            type: 'GROUP',
            course: { instructorId, deletedAt: null },
        },
        select: { id: true, courseId: true, startTime: true },
    });
    if (!session?.courseId) {
        throw new AppError('Session not found or you do not have access.', 404);
    }
    const enrolled = await prisma.coursePurchase.findFirst({
        where: { courseId: session.courseId, studentId },
    });
    if (!enrolled) {
        throw new AppError('Student is not enrolled in this course.', 400);
    }
    if (present) {
        const joinedAt = session.startTime <= new Date() ? session.startTime : new Date();
        await prisma.liveClassAttendance.upsert({
            where: {
                studentId_liveSessionId: { studentId, liveSessionId: sessionId },
            },
            create: {
                studentId,
                liveSessionId: sessionId,
                joinedAt,
                durationMinutes: 0,
            },
            update: {
                joinedAt,
                leftAt: null,
                durationMinutes: 0,
            },
        });
    }
    else {
        await prisma.liveClassAttendance.deleteMany({
            where: { studentId, liveSessionId: sessionId },
        });
    }
    const detail = await getSessionAttendanceDetail(instructorId, sessionId);
    const rosterRow = detail.roster.find((row) => row.studentId === studentId);
    emitAttendanceUpdated({
        sessionId,
        studentId,
        status: rosterRow?.status === 'ABSENT' ? 'ABSENT' : rosterRow?.status === 'LEFT' ? 'LEFT' : 'PRESENT',
        joinedAt: rosterRow?.joinedAt ? new Date(rosterRow.joinedAt).toISOString() : null,
        leftAt: rosterRow?.leftAt ? new Date(rosterRow.leftAt).toISOString() : null,
        durationMinutes: rosterRow?.durationMinutes ?? 0,
        sessionTitle: detail.session.title,
        courseTitle: detail.session.courseTitle,
    });
    emitSessionAttendanceRefresh(sessionId, detail);
    return detail;
};
//# sourceMappingURL=instructor-attendance.service.js.map