import { prisma } from '../../../prisma.js';
function liveSessionWhere(instructorId, now) {
    return {
        instructorId,
        endTime: { gte: now },
        status: { in: ['UPCOMING', 'ONGOING'] },
    };
}
function liveLessonWhere(instructorId, now) {
    return {
        deletedAt: null,
        isLive: true,
        availableAt: { not: null, gte: now },
        section: {
            deletedAt: null,
            unit: {
                course: {
                    instructorId,
                    deletedAt: null,
                },
            },
        },
    };
}
export async function fetchInstructorUpcomingSessions(instructorId, limit = 5) {
    const now = new Date();
    const [liveSessions, liveLessons] = await Promise.all([
        prisma.liveSession.findMany({
            where: liveSessionWhere(instructorId, now),
            orderBy: { startTime: 'asc' },
            take: limit,
            select: {
                id: true,
                title: true,
                type: true,
                startTime: true,
                endTime: true,
                meetingUrl: true,
                status: true,
                course: { select: { id: true, title: true } },
                student: { select: { fullName: true } },
            },
        }),
        prisma.lesson.findMany({
            where: liveLessonWhere(instructorId, now),
            orderBy: { availableAt: 'asc' },
            take: limit,
            select: {
                id: true,
                title: true,
                availableAt: true,
                durationSeconds: true,
                meetingUrl: true,
                section: {
                    select: {
                        unit: {
                            select: {
                                course: { select: { id: true, title: true } },
                            },
                        },
                    },
                },
            },
        }),
    ]);
    const fromSessions = liveSessions.map((s) => ({
        id: `session:${s.id}`,
        source: 'live_session',
        sessionId: s.id,
        title: s.title || s.course?.title || 'Live session',
        startTime: s.startTime,
        endTime: s.endTime,
        meetingUrl: s.meetingUrl,
        status: s.status,
        type: s.type,
        studentName: s.student?.fullName ?? null,
        course: s.course,
    }));
    const fromLessons = liveLessons
        .filter((l) => l.availableAt)
        .map((l) => {
        const startTime = l.availableAt;
        const durationMs = (l.durationSeconds > 0 ? l.durationSeconds : 3600) * 1000;
        return {
            id: `lesson:${l.id}`,
            source: 'live_lesson',
            lessonId: l.id,
            title: l.title,
            startTime,
            endTime: new Date(startTime.getTime() + durationMs),
            meetingUrl: l.meetingUrl,
            status: 'UPCOMING',
            course: l.section.unit.course,
        };
    });
    return [...fromSessions, ...fromLessons]
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, limit);
}
export async function countInstructorUpcomingSessions(instructorId) {
    const now = new Date();
    const [sessionCount, lessonCount] = await Promise.all([
        prisma.liveSession.count({ where: liveSessionWhere(instructorId, now) }),
        prisma.lesson.count({ where: liveLessonWhere(instructorId, now) }),
    ]);
    return sessionCount + lessonCount;
}
//# sourceMappingURL=instructor-upcoming-sessions.js.map