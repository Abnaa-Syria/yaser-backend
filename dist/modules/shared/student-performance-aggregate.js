/**
 * Shared aggregation for student performance payloads (admin full scope vs instructor course scope).
 */
export function pct(score, max) {
    if (score == null || max == null || max <= 0)
        return null;
    return Math.round((score / max) * 1000) / 10;
}
export function buildStudentPerformanceBundle({ enrollments, examSubs, hwSubs, homeworksAssigned, lessonProgressRows, completedSessionsCount, totalSpent, totalLessonsInEnrolledCourses, attendanceSummary, }) {
    const examsTaken = examSubs.length;
    const examPercents = examSubs
        .map((s) => pct(s.totalScore, s.exam?.totalPoints ?? null))
        .filter((x) => x != null);
    const averageExamScorePercent = examPercents.length > 0
        ? Math.round((examPercents.reduce((a, b) => a + b, 0) / examPercents.length) * 10) / 10
        : 0;
    const passed = examSubs.filter((s) => s.isPassed === true).length;
    const failed = examSubs.filter((s) => s.isPassed === false).length;
    const passFailGraded = passed + failed;
    const passRatePercent = passFailGraded > 0 ? Math.round((passed / passFailGraded) * 1000) / 10 : null;
    const submittedHomework = hwSubs.filter((h) => h.submittedAt != null).length;
    const gradedHomeworkSubs = hwSubs.filter((h) => h.status === 'GRADED' || h.grade != null);
    const pendingHomework = hwSubs.filter((h) => h.submittedAt != null && h.status === 'PENDING' && h.grade == null).length;
    const hwGrades = gradedHomeworkSubs.map((h) => h.grade).filter((g) => g != null);
    const averageHomeworkGrade = hwGrades.length > 0 ? Math.round((hwGrades.reduce((a, b) => a + b, 0) / hwGrades.length) * 10) / 10 : 0;
    const homeworkCompletionRatePercent = homeworksAssigned > 0
        ? Math.min(100, Math.round((submittedHomework / homeworksAssigned) * 1000) / 10)
        : 0;
    const courseProgressAvg = enrollments.length > 0
        ? enrollments.reduce((s, e) => s + (e.progressPercentage ?? 0), 0) / enrollments.length
        : 0;
    const completedLessonMarks = lessonProgressRows.filter((r) => r.isCompleted).length;
    const lessonCompletionRatePercent = totalLessonsInEnrolledCourses > 0
        ? Math.min(100, Math.round((completedLessonMarks / totalLessonsInEnrolledCourses) * 1000) / 10)
        : Math.round(courseProgressAvg * 10) / 10;
    const attendance = attendanceSummary
        ? {
            mode: 'live_sessions',
            totalSessions: attendanceSummary.totalSessions,
            presentCount: attendanceSummary.presentCount,
            absentCount: attendanceSummary.absentCount,
            attendanceRatePercent: attendanceSummary.attendanceRatePercent,
        }
        : {
            mode: 'lesson_progress',
            totalSessions: completedSessionsCount,
            presentCount: 0,
            absentCount: completedSessionsCount,
            attendanceRatePercent: 0,
            completedLiveSessionsInEnrolledCourses: completedSessionsCount,
            lessonCompletionRatePercent,
            courseProgressAveragePercent: Math.round(courseProgressAvg * 10) / 10,
        };
    const recentExam = examSubs.slice(0, 10).map((s) => ({
        kind: 'exam',
        id: s.id,
        title: s.exam?.title ?? 'Exam',
        context: null,
        score: s.totalScore ?? null,
        maxPoints: s.exam?.totalPoints ?? null,
        percent: pct(s.totalScore, s.exam?.totalPoints ?? null),
        passed: s.isPassed ?? null,
        occurredAt: (s.submittedAt ?? s.startedAt).toISOString(),
    }));
    const recentHw = hwSubs.slice(0, 10).map((h) => {
        const dt = h.gradedAt ?? h.submittedAt;
        return {
            kind: 'homework',
            id: h.id,
            title: h.homework?.title ?? 'Homework',
            context: h.homework?.course?.title ?? null,
            score: h.grade ?? null,
            maxPoints: h.homework?.totalPoints ?? null,
            percent: pct(h.grade ?? null, h.homework?.totalPoints ?? null),
            passed: null,
            occurredAt: dt ? dt.toISOString() : new Date(0).toISOString(),
        };
    });
    const recentGrades = [...recentExam, ...recentHw]
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 5);
    const overview = {
        coursesEnrolled: enrollments.length,
        coursesCompleted: enrollments.filter((e) => e.isCompleted).length,
        totalSpent,
        examsTaken,
        averageExamScorePercent,
        enrollments: enrollments.map((e) => ({
            enrollmentId: e.id,
            courseId: e.course.id,
            courseTitle: e.course.title,
            courseType: e.course.type,
            progressPercentage: Math.round((e.progressPercentage ?? 0) * 10) / 10,
            isCompleted: e.isCompleted,
        })),
    };
    return {
        overview,
        exams: {
            totalTaken: examsTaken,
            averageScorePercent: averageExamScorePercent,
            passed,
            failed,
            passUndetermined: examsTaken - passFailGraded,
            passRatePercent,
        },
        homework: {
            totalSubmissions: hwSubs.length,
            submittedCount: submittedHomework,
            gradedCount: gradedHomeworkSubs.length,
            pendingGradingCount: pendingHomework,
            averageGrade: averageHomeworkGrade,
            completionRatePercent: homeworkCompletionRatePercent,
            assignedCount: homeworksAssigned,
        },
        progress: {
            overallPercent: Math.round(Math.max(lessonCompletionRatePercent, courseProgressAvg) * 10) / 10,
            lessonCompletionRatePercent,
            courseProgressAveragePercent: Math.round(courseProgressAvg * 10) / 10,
            completedLessonsCount: completedLessonMarks,
            totalLessonsInEnrolledCourses,
            attendance,
        },
        recentGrades,
    };
}
//# sourceMappingURL=student-performance-aggregate.js.map