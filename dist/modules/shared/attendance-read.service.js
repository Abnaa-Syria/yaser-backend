import { prisma } from '../../prisma.js';
export async function resolveStudentCourseIds(studentId, courseIds) {
    if (courseIds?.length)
        return courseIds;
    const enrollments = await prisma.coursePurchase.findMany({
        where: { studentId },
        select: { courseId: true },
    });
    return enrollments.map((e) => e.courseId);
}
export async function getStudentAttendanceReport(studentId, courseIds) {
    const ids = await resolveStudentCourseIds(studentId, courseIds);
    if (!ids.length) {
        return {
            summary: {
                totalSessions: 0,
                presentCount: 0,
                absentCount: 0,
                attendanceRatePercent: 0,
            },
            records: [],
        };
    }
    const sessions = await prisma.liveSession.findMany({
        where: {
            courseId: { in: ids },
            type: 'GROUP',
        },
        orderBy: { startTime: 'desc' },
        select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            courseId: true,
            course: { select: { title: true } },
            attendances: {
                where: { studentId },
                select: {
                    joinedAt: true,
                    leftAt: true,
                    durationMinutes: true,
                },
                take: 1,
            },
        },
    });
    const records = sessions.map((session) => {
        const record = session.attendances[0];
        let status = 'ABSENT';
        if (record) {
            status = record.leftAt ? 'LEFT' : 'PRESENT';
        }
        return {
            sessionId: session.id,
            title: session.title,
            courseId: session.courseId,
            courseTitle: session.course?.title ?? '—',
            startTime: session.startTime,
            endTime: session.endTime,
            sessionStatus: session.status,
            status,
            joinedAt: record?.joinedAt ?? null,
            leftAt: record?.leftAt ?? null,
            durationMinutes: record?.durationMinutes ?? 0,
        };
    });
    const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'LEFT').length;
    const totalSessions = records.length;
    return {
        summary: {
            totalSessions,
            presentCount,
            absentCount: Math.max(0, totalSessions - presentCount),
            attendanceRatePercent: totalSessions
                ? Math.round((presentCount / totalSessions) * 100)
                : 0,
        },
        records,
    };
}
export async function getStudentAttendanceSummary(studentId) {
    const { summary } = await getStudentAttendanceReport(studentId);
    return summary;
}
//# sourceMappingURL=attendance-read.service.js.map