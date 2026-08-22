/**
 * Shared aggregation for student performance payloads (admin full scope vs instructor course scope).
 */

export type PerformanceEnrollmentRow = {
  id: string;
  courseId: string;
  progressPercentage: number | null;
  isCompleted: boolean;
  expiresAt?: Date | null;
  purchasedAt?: Date;
  course: {
    id: string;
    title: string;
    type: string;
  };
};

export type PerformanceExamSubmissionRow = {
  id: string;
  studentId: string;
  examId: string;
  startedAt: Date;
  submittedAt: Date | null;
  totalScore: number | null;
  isPassed: boolean | null;
  exam: {
    id: string;
    title: string;
    totalPoints: number;
    passingScore: number;
  } | null;
};

export type PerformanceLessonProgressRow = {
  isCompleted: boolean;
  courseId: string | null;
  watchPercentage: number | null;
};

export function pct(score: number | null | undefined, max: number | null | undefined): number | null {
  if (score == null || max == null || max <= 0) return null;
  return Math.round((score / max) * 1000) / 10;
}

export type StudentPerformanceBundle = {
  overview: {
    coursesEnrolled: number;
    coursesCompleted: number;
    totalSpent: number;
    examsTaken: number;
    averageExamScorePercent: number;
    enrollments: Array<{
      enrollmentId: string;
      courseId: string;
      courseTitle: string;
      courseType: string;
      progressPercentage: number;
      isCompleted: boolean;
      expiresAt: string | null;
      purchasedAt: string | null;
    }>;
  };
  exams: {
    totalTaken: number;
    averageScorePercent: number;
    passed: number;
    failed: number;
    passUndetermined: number;
    passRatePercent: number | null;
  };
  progress: {
    overallPercent: number;
    lessonCompletionRatePercent: number;
    courseProgressAveragePercent: number;
    completedLessonsCount: number;
    totalLessonsInEnrolledCourses: number;
  };
  recentGrades: Array<{
    kind: 'exam';
    id: string;
    title: string;
    context?: string | null;
    score: number | null;
    maxPoints: number | null;
    percent: number | null;
    passed: boolean | null;
    occurredAt: string;
  }>;
};

type AggregateArgs = {
  enrollments: PerformanceEnrollmentRow[];
  examSubs: PerformanceExamSubmissionRow[];
  lessonProgressRows: PerformanceLessonProgressRow[];
  totalSpent: number;
  totalLessonsInEnrolledCourses: number;
};

export function buildStudentPerformanceBundle({
  enrollments,
  examSubs,
  lessonProgressRows,
  totalSpent,
  totalLessonsInEnrolledCourses,
}: AggregateArgs): StudentPerformanceBundle {
  const examsTaken = examSubs.length;
  const examPercents = examSubs
    .map((s) => pct(s.totalScore, s.exam?.totalPoints ?? null))
    .filter((x): x is number => x != null);
  const averageExamScorePercent =
    examPercents.length > 0
      ? Math.round((examPercents.reduce((a, b) => a + b, 0) / examPercents.length) * 10) / 10
      : 0;

  const passed = examSubs.filter((s) => s.isPassed === true).length;
  const failed = examSubs.filter((s) => s.isPassed === false).length;
  const passFailGraded = passed + failed;
  const passRatePercent =
    passFailGraded > 0 ? Math.round((passed / passFailGraded) * 1000) / 10 : null;

  const courseProgressAvg =
    enrollments.length > 0
      ? enrollments.reduce((s, e) => s + (e.progressPercentage ?? 0), 0) / enrollments.length
      : 0;

  const completedLessonMarks = lessonProgressRows.filter((r) => r.isCompleted).length;
  const lessonCompletionRatePercent =
    totalLessonsInEnrolledCourses > 0
      ? Math.min(100, Math.round((completedLessonMarks / totalLessonsInEnrolledCourses) * 1000) / 10)
      : Math.round(courseProgressAvg * 10) / 10;

  const recentGrades = examSubs.slice(0, 10).map((s) => ({
    kind: 'exam' as const,
    id: s.id,
    title: s.exam?.title ?? 'Exam',
    context: null,
    score: s.totalScore ?? null,
    maxPoints: s.exam?.totalPoints ?? null,
    percent: pct(s.totalScore, s.exam?.totalPoints ?? null),
    passed: s.isPassed ?? null,
    occurredAt: (s.submittedAt ?? s.startedAt).toISOString(),
  }));

  const overview: StudentPerformanceBundle['overview'] = {
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
      expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
      purchasedAt: e.purchasedAt ? e.purchasedAt.toISOString() : null,
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
    progress: {
      overallPercent: Math.round(Math.max(lessonCompletionRatePercent, courseProgressAvg) * 10) / 10,
      lessonCompletionRatePercent,
      courseProgressAveragePercent: Math.round(courseProgressAvg * 10) / 10,
      completedLessonsCount: completedLessonMarks,
      totalLessonsInEnrolledCourses,
    },
    recentGrades,
  };
}
