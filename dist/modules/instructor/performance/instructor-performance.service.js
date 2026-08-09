import { prisma } from '../../../prisma.js';
const MS_PER_MIN = 60000;
function round1(n) {
    return Math.round(n * 10) / 10;
}
function pct(part, whole) {
    if (!whole)
        return 0;
    return round1((part / whole) * 100);
}
function groupCount(row) {
    const c = row._count;
    if (!c || c === true)
        return 0;
    return c._all ?? 0;
}
/**
 * Full instructor performance dashboard: live sessions, recordings, homework, reviews.
 */
export const getInstructorPerformanceDashboard = async (instructorId) => {
    const courses = await prisma.course.findMany({
        where: { instructorId },
        select: { id: true, title: true },
    });
    const courseIds = courses.map((c) => c.id);
    if (!courseIds.length) {
        return {
            instructorRating: 0,
            totalReviews: 0,
            averageCourseRating: 0,
            sessions: {
                total: 0,
                finished: 0,
                pending: 0,
                running: 0,
                missed: 0,
                liveSessions: 0,
                physicalSessions: 0,
                transferredSessions: 0,
                privateSessions: 0,
                avgDurationMinutes: 0,
                studentAttendance: { present: 0, totalSlots: 0, percentage: 0 },
            },
            recordings: {
                totalFinishedSessions: 0,
                recordsUploaded: 0,
                uploadedWithin24h: 0,
                uploadRatePct: 0,
                onTimeRatePct: 0,
            },
            checklist: { totalSessions: 0, checklistsSubmitted: 0 },
            surveys: { totalSessions: 0, surveysSubmitted: 0 },
            reviews: {
                overallRating: 0,
                totalResponses: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                questionBreakdown: [],
            },
        };
    }
    const lessonCounts = await prisma.lesson.groupBy({
        by: ['sectionId'],
        where: { section: { unit: { courseId: { in: courseIds } } } },
        _count: { _all: true },
    });
    const sectionIds = lessonCounts.map((row) => row.sectionId);
    const sections = sectionIds.length > 0
        ? await prisma.section.findMany({
            where: { id: { in: sectionIds } },
            select: { id: true, unit: { select: { courseId: true } } },
        })
        : [];
    const sectionToCourse = new Map(sections.map((s) => [s.id, s.unit.courseId]));
    const [sessions, instructorAgg, courseReviewAgg, irRatings, crReviews, attendanceBySession, purchasesByCourse] = await prisma.$transaction([
        prisma.liveSession.findMany({
            where: { instructorId },
            select: {
                id: true,
                type: true,
                status: true,
                startTime: true,
                endTime: true,
                recordingUrl: true,
                updatedAt: true,
                courseId: true,
            },
        }),
        prisma.instructorReview.aggregate({
            where: { instructorId },
            _avg: { rating: true },
            _count: { id: true },
        }),
        prisma.courseReview.aggregate({
            where: { course: { instructorId } },
            _avg: { rating: true },
        }),
        prisma.instructorReview.findMany({
            where: { instructorId },
            select: { rating: true },
        }),
        prisma.courseReview.findMany({
            where: { course: { instructorId } },
            select: { rating: true, courseId: true },
        }),
        prisma.liveClassAttendance.groupBy({
            by: ['liveSessionId'],
            where: {
                liveSession: { instructorId, courseId: { in: courseIds }, type: 'GROUP' },
            },
            orderBy: { liveSessionId: 'asc' },
            _count: { _all: true },
        }),
        prisma.coursePurchase.groupBy({
            by: ['courseId'],
            where: { courseId: { in: courseIds } },
            orderBy: { courseId: 'asc' },
            _count: { _all: true },
        }),
    ]);
    const lessonsPerCourse = new Map();
    for (const row of lessonCounts) {
        const cid = sectionToCourse.get(row.sectionId);
        if (!cid)
            continue;
        const count = typeof row._count === 'object' && row._count ? row._count._all ?? 0 : 0;
        lessonsPerCourse.set(cid, (lessonsPerCourse.get(cid) || 0) + count);
    }
    const courseIdSet = new Set(courseIds);
    const total = sessions.length;
    const finished = sessions.filter((s) => s.status === 'COMPLETED').length;
    const pending = sessions.filter((s) => s.status === 'UPCOMING').length;
    const running = sessions.filter((s) => s.status === 'ONGOING').length;
    const missed = sessions.filter((s) => s.status === 'MISSED').length;
    const liveGroup = sessions.filter((s) => s.type === 'GROUP').length;
    const completedWithTimes = sessions.filter((s) => s.status === 'COMPLETED');
    let avgDurationMinutes = 0;
    if (completedWithTimes.length) {
        const sumMin = completedWithTimes.reduce((acc, s) => {
            const m = (s.endTime.getTime() - s.startTime.getTime()) / MS_PER_MIN;
            return acc + (m > 0 ? m : 0);
        }, 0);
        avgDurationMinutes = round1(sumMin / completedWithTimes.length);
    }
    const enrollmentByCourse = new Map(purchasesByCourse.map((row) => [row.courseId, groupCount(row)]));
    const attendanceCountBySession = new Map(attendanceBySession.map((row) => [row.liveSessionId, groupCount(row)]));
    const completedGroupSessions = sessions.filter((s) => s.status === 'COMPLETED' && s.type === 'GROUP' && s.courseId && courseIdSet.has(s.courseId));
    let attendancePresent = 0;
    let attendanceTotalSlots = 0;
    for (const s of completedGroupSessions) {
        const enrolled = enrollmentByCourse.get(s.courseId) || 0;
        attendanceTotalSlots += enrolled;
        attendancePresent += attendanceCountBySession.get(s.id) || 0;
    }
    const liveAttendanceRatePct = attendanceTotalSlots > 0 ? round1((attendancePresent / attendanceTotalSlots) * 100) : 0;
    const finishedLiveForRecording = sessions.filter((s) => s.status === 'COMPLETED' && s.type === 'GROUP' && s.courseId && courseIdSet.has(s.courseId));
    const finishedRecordingCount = finishedLiveForRecording.length;
    const recordsUploaded = finishedLiveForRecording.filter((s) => !!s.recordingUrl?.trim()).length;
    const uploadedWithin24h = finishedLiveForRecording.filter((s) => {
        if (!s.recordingUrl?.trim())
            return false;
        const deadline = new Date(s.endTime.getTime() + 24 * 60 * MS_PER_MIN);
        return s.updatedAt <= deadline;
    }).length;
    const uploadRatePct = pct(recordsUploaded, finishedRecordingCount);
    const onTimeRatePct = pct(uploadedWithin24h, finishedRecordingCount);
    const [checklistsSubmitted, surveysSubmitted] = await prisma.$transaction([
        prisma.homeworkSubmission.count({
            where: {
                submittedAt: { not: null },
                homework: { courseId: { in: courseIds } },
            },
        }),
        prisma.courseReview.count({
            where: { course: { instructorId } },
        }),
    ]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of irRatings) {
        distribution[row.rating] = (distribution[row.rating] || 0) + 1;
    }
    for (const row of crReviews) {
        distribution[row.rating] = (distribution[row.rating] || 0) + 1;
    }
    const totalIr = instructorAgg._count.id;
    const totalCr = crReviews.length;
    const totalResponses = totalIr + totalCr;
    let weightedSum = 0;
    for (const row of irRatings)
        weightedSum += row.rating;
    for (const row of crReviews)
        weightedSum += row.rating;
    const overallRating = totalResponses ? round1(weightedSum / totalResponses) : 0;
    const courseStats = new Map();
    for (const row of crReviews) {
        const cur = courseStats.get(row.courseId) || { sum: 0, n: 0 };
        cur.sum += row.rating;
        cur.n += 1;
        courseStats.set(row.courseId, cur);
    }
    const courseNameById = new Map(courses.map((c) => [c.id, c.title]));
    const questionBreakdown = [
        {
            question: 'Direct instructor reviews',
            avgRating: round1(instructorAgg._avg.rating || 0),
            responses: totalIr,
        },
        {
            question: 'Course reviews (all)',
            avgRating: round1(courseReviewAgg._avg.rating || 0),
            responses: totalCr,
        },
    ];
    for (const [cid, stats] of courseStats) {
        const name = courseNameById.get(cid) || 'Course';
        questionBreakdown.push({
            question: `Course: ${name}`,
            avgRating: stats.n ? round1(stats.sum / stats.n) : 0,
            responses: stats.n,
        });
    }
    return {
        instructorRating: round1(instructorAgg._avg.rating || 0),
        totalReviews: totalIr,
        averageCourseRating: round1(courseReviewAgg._avg.rating || 0),
        sessions: {
            total,
            finished,
            pending,
            running,
            missed,
            liveSessions: liveGroup,
            physicalSessions: 0,
            transferredSessions: 0,
            privateSessions: sessions.filter((s) => s.type === 'PRIVATE').length,
            avgDurationMinutes,
            studentAttendance: {
                present: attendancePresent,
                totalSlots: attendanceTotalSlots,
                percentage: liveAttendanceRatePct,
            },
        },
        recordings: {
            totalFinishedSessions: finishedRecordingCount,
            recordsUploaded,
            uploadedWithin24h,
            uploadRatePct,
            onTimeRatePct,
        },
        checklist: {
            totalSessions: finishedRecordingCount || finished,
            checklistsSubmitted,
        },
        surveys: {
            totalSessions: finishedRecordingCount || finished,
            surveysSubmitted,
        },
        reviews: {
            overallRating,
            totalResponses,
            distribution,
            questionBreakdown,
        },
    };
};
//# sourceMappingURL=instructor-performance.service.js.map