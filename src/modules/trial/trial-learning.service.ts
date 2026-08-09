import type { Prisma } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { isCourseInActiveTrial, listActiveTrialCourses, loadTrialSettings } from './trial-settings.js';

async function requireTrialCourseAccess(courseId: string) {
  const settings = await loadTrialSettings();
  if (!settings.enabled) throw new AppError('Free trial is currently disabled.', 403);
  const ok = await isCourseInActiveTrial(courseId);
  if (!ok) throw new AppError('This course is not included in the free trial.', 403);
}

function toStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function formatExamScope(exam: any) {
  if (exam.lesson?.title) {
    return `${exam.course?.title || exam.lesson.section?.unit?.course?.title || 'Course'} - ${exam.lesson.title}`;
  }
  if (exam.unit?.title) return `${exam.course?.title || exam.unit.course?.title || 'Course'} - ${exam.unit.title}`;
  return exam.course?.title || exam.unit?.course?.title || exam.lesson?.section?.unit?.course?.title || 'Course';
}

function getDefaultInstructions() {
  return [
    'Read all questions carefully before answering',
    'You must complete the exam in one sitting',
    'Once you start, the timer cannot be paused',
    'Make sure you have a stable internet connection',
    'Submit your answers before time runs out',
    'You cannot return to the exam after submission',
  ];
}

function getDefaultPreparationTips() {
  return [
    'Review all covered lessons before the exam',
    'Practice with class recordings',
    'Review flashcards for key topics',
    'Get enough rest before exam day',
  ];
}

function typeLabel(type: string) {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'Multiple choice';
    case 'TRUE_FALSE':
      return 'True / False';
    case 'SHORT_ANSWER':
      return 'Short answer';
    case 'ESSAY':
      return 'Essay';
    default:
      return type;
  }
}

function getExamStructure(exam: any) {
  if (Array.isArray(exam.examStructure) && exam.examStructure.length > 0) return exam.examStructure;
  const grouped = new Map<string, { title: string; questionCount: number; points: number }>();
  for (const question of exam.questions || []) {
    const existing = grouped.get(question.type) || {
      title: typeLabel(question.type),
      questionCount: 0,
      points: 0,
    };
    existing.questionCount += 1;
    existing.points += Number(question.points || 0);
    grouped.set(question.type, existing);
  }
  return [...grouped.values()];
}

async function getCoveredTopics(exam: any) {
  const savedTopics = toStringList(exam.coveredTopics);
  if (savedTopics.length > 0) return savedTopics;
  if (exam.lessonId && exam.lesson?.title) return [exam.lesson.title];
  return [];
}

async function resolveTrialCourseIds(filters: { courseId?: string } = {}) {
  const rows = await listActiveTrialCourses();
  const ids = rows.map((r) => r.courseId);
  if (filters.courseId) {
    if (!ids.includes(filters.courseId)) return [];
    return [filters.courseId];
  }
  return ids;
}

async function resolveExamCourseId(exam: any): Promise<string | null> {
  return exam.courseId || exam.unit?.courseId || exam.lesson?.section?.unit?.courseId || null;
}

async function assertTrialExamAccess(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      unit: { select: { courseId: true } },
      lesson: { include: { section: { select: { unit: { select: { courseId: true } } } } } },
    },
  });
  if (!exam) throw new AppError('Exam not found.', 404);
  const courseId = await resolveExamCourseId(exam);
  if (courseId) await requireTrialCourseAccess(courseId);
  return exam;
}

async function shapeExamDetailsForTrial(exam: any, mySubmission: any) {
  const coveredTopics = await getCoveredTopics(exam);
  const examStructure = getExamStructure(exam);
  const importantInstructions = toStringList(exam.importantInstructions);
  const preparationTips = toStringList(exam.preparationTips);

  return {
    ...exam,
    subtitle: formatExamScope(exam),
    about: exam.description,
    coveredTopics,
    examStructure,
    importantInstructions: importantInstructions.length > 0 ? importantInstructions : getDefaultInstructions(),
    preparationTips: preparationTips.length > 0 ? preparationTips : getDefaultPreparationTips(),
    readyMessage:
      exam.readyMessage ||
      `Make sure you have ${exam.durationMinutes} minutes available and a stable internet connection.`,
    detailCards: {
      examDate: exam.scheduledAt,
      durationMinutes: exam.durationMinutes,
      totalScore: exam.totalPoints,
      passingScore: exam.passingScore,
    },
    canStart: exam.status === 'AVAILABLE' && !mySubmission?.submittedAt,
    mySubmission,
  };
}

export async function listTrialFlashcards(query: {
  courseId?: string;
  unitId?: string;
  lessonId?: string;
}) {
  const allowedCourseIds = await resolveTrialCourseIds({ courseId: query.courseId });
  if (allowedCourseIds.length === 0) return [];

  const where: Prisma.FlashcardWhereInput = {
    status: 'PUBLISHED',
    lesson: {
      deletedAt: null,
      section: {
        deletedAt: null,
        unit: {
          courseId: { in: allowedCourseIds },
        },
      },
    },
  };

  if (query.lessonId) where.lessonId = query.lessonId;
  if (query.unitId || query.courseId) {
    where.lesson = {
      ...(where.lesson as Prisma.LessonWhereInput),
      section: {
        deletedAt: null,
        unit: {
          ...(query.unitId ? { id: query.unitId } : {}),
          courseId: { in: allowedCourseIds },
        },
      },
    };
  }

  return prisma.flashcard.findMany({
    where,
    orderBy: [{ lessonId: 'asc' }, { displayOrder: 'asc' }],
    select: {
      id: true,
      lessonId: true,
      front: true,
      frontAr: true,
      back: true,
      backAr: true,
      explanation: true,
      explanationAr: true,
      displayOrder: true,
      lesson: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          section: {
            select: {
              id: true,
              title: true,
              unit: { select: { id: true, title: true, titleAr: true, courseId: true } },
            },
          },
        },
      },
    },
  });
}

export async function listTrialExams(trialSessionId: string, filters: { courseId?: string; unitId?: string; lessonId?: string } = {}) {
  const authorizedCourseIds = await resolveTrialCourseIds({ courseId: filters.courseId });
  if (authorizedCourseIds.length === 0) return [];

  const authorizedScope = {
    OR: [
      { courseId: { in: authorizedCourseIds } },
      { unit: { courseId: { in: authorizedCourseIds } } },
      { lesson: { section: { unit: { courseId: { in: authorizedCourseIds } } } } },
    ],
  };
  const where: any = { AND: [authorizedScope] };

  if (filters.unitId) {
    where.AND.push({ OR: [{ unitId: filters.unitId }, { lesson: { section: { unitId: filters.unitId } } }] });
  }
  if (filters.lessonId) {
    where.AND.push({ lessonId: filters.lessonId });
  }

  const exams = await prisma.exam.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      type: true,
      scheduledAt: true,
      durationMinutes: true,
      totalPoints: true,
      passingScore: true,
      courseId: true,
      unitId: true,
      lessonId: true,
      course: { select: { id: true, title: true } },
      unit: { select: { id: true, title: true, courseId: true, course: { select: { id: true, title: true } } } },
      lesson: {
        select: {
          id: true,
          title: true,
          section: {
            select: {
              unit: { select: { id: true, title: true, courseId: true, course: { select: { id: true, title: true } } } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (exams.length === 0) return [];

  const examIds = exams.map((e) => e.id);
  const submissions = await prisma.trialExamSubmission.findMany({
    where: { trialSessionId, examId: { in: examIds } },
    select: {
      id: true,
      examId: true,
      startedAt: true,
      submittedAt: true,
      totalScore: true,
      isPassed: true,
    },
    orderBy: { attempt: 'desc' },
  });
  const submissionByExam = new Map<string, (typeof submissions)[number]>();
  for (const s of submissions) {
    if (!submissionByExam.has(s.examId)) submissionByExam.set(s.examId, s);
  }

  return exams.map((exam) => ({
    ...exam,
    mySubmission: submissionByExam.get(exam.id) ?? null,
  }));
}

export async function getTrialExamDetails(trialSessionId: string, examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      course: { select: { id: true, title: true } },
      lesson: {
        include: {
          section: { select: { unit: { select: { courseId: true, course: { select: { id: true, title: true } } } } } },
        },
      },
      unit: { select: { id: true, title: true, courseId: true, course: { select: { id: true, title: true } } } },
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          questionText: true,
          type: true,
          points: true,
          order: true,
          options: true,
        },
      },
    },
  });
  if (!exam) throw new AppError('Exam not found.', 404);

  const courseId = await resolveExamCourseId(exam);
  if (courseId) {
    const ok = await isCourseInActiveTrial(courseId);
    if (!ok) throw new AppError('This exam is not included in the free trial.', 403);
  }

  const mySubmission = await prisma.trialExamSubmission.findFirst({
    where: { trialSessionId, examId: exam.id },
    orderBy: { attempt: 'desc' },
    select: {
      id: true,
      attempt: true,
      startedAt: true,
      submittedAt: true,
      totalScore: true,
      isPassed: true,
    },
  });

  return shapeExamDetailsForTrial(exam, mySubmission);
}

export async function startTrialExam(trialSessionId: string, examId: string) {
  const exam = await assertTrialExamAccess(examId);

  if (exam.status === 'UPCOMING' || exam.status === 'EXPIRED') {
    throw new AppError(`Cannot start exam. The exam is currently ${exam.status.toLowerCase()}.`, 400);
  }

  const activeSubmission = await prisma.trialExamSubmission.findFirst({
    where: { trialSessionId, examId, submittedAt: null },
    orderBy: { attempt: 'desc' },
  });
  if (activeSubmission) return activeSubmission;

  const latestSubmission = await prisma.trialExamSubmission.findFirst({
    where: { trialSessionId, examId },
    orderBy: { attempt: 'desc' },
    select: { attempt: true },
  });
  const nextAttempt = (latestSubmission?.attempt ?? 0) + 1;

  try {
    return await prisma.trialExamSubmission.create({
      data: {
        trialSessionId,
        examId,
        attempt: nextAttempt,
        startedAt: new Date(),
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return prisma.trialExamSubmission.findFirst({
        where: { trialSessionId, examId, submittedAt: null },
        orderBy: { attempt: 'desc' },
      });
    }
    throw error;
  }
}

type SubmitExamAnswerInput = {
  questionId: string;
  optionId?: string;
  answerText?: string | null;
};

function questionHasOption(question: { options: unknown }, optionId: string) {
  if (!Array.isArray(question.options)) return false;
  return question.options.some((option) => {
    if (!option || typeof option !== 'object') return false;
    return (option as { id?: unknown }).id === optionId;
  });
}

export async function submitTrialExam(
  trialSessionId: string,
  examId: string,
  answers: SubmitExamAnswerInput[]
) {
  await assertTrialExamAccess(examId);

  const submission = await prisma.trialExamSubmission.findFirst({
    where: { trialSessionId, examId, submittedAt: null },
    orderBy: { attempt: 'desc' },
    include: { exam: { include: { questions: true } } },
  });

  if (!submission) throw new AppError('Submission not found. Did you start the exam?', 404);
  if (submission.submittedAt) throw new AppError('Exam already submitted.', 400);
  if (submission.exam.status !== 'AVAILABLE') {
    throw new AppError(`Cannot submit exam. The exam is currently ${submission.exam.status.toLowerCase()}.`, 400);
  }

  const now = Date.now();
  const startedAt = submission.startedAt.getTime();
  const elapsedMinutes = (now - startedAt) / (1000 * 60);
  const allowedMinutes = submission.exam.durationMinutes + 2;
  if (elapsedMinutes > allowedMinutes) {
    throw new AppError(
      `Exam time expired. Allowed: ${submission.exam.durationMinutes}m. Elapsed: ${Math.floor(elapsedMinutes)}m.`,
      400
    );
  }

  let totalScore = 0;
  const gradedAnswers = submission.exam.questions.map((question) => {
    const studentAnswer = answers.find((a) => a.questionId === question.id);
    const selectedOptionId = studentAnswer?.optionId;
    if ((question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') && selectedOptionId) {
      if (!questionHasOption(question, selectedOptionId)) {
        throw new AppError('Invalid option selected for one or more questions.', 400);
      }
    }
    const answerText = selectedOptionId || studentAnswer?.answerText || null;

    let isCorrect: boolean | null = null;
    let pointsEarned = 0;
    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
      isCorrect = answerText === question.correctAnswer;
      pointsEarned = isCorrect ? question.points : 0;
    }
    if (isCorrect) totalScore += pointsEarned;

    return {
      questionId: question.id,
      answerText,
      isCorrect,
      pointsEarned,
    };
  });

  const isPassed = totalScore >= submission.exam.passingScore;

  return prisma.$transaction(async (tx) => {
    await tx.trialExamAnswer.deleteMany({ where: { submissionId: submission.id } });
    await tx.trialExamAnswer.createMany({
      data: gradedAnswers.map((a) => ({ ...a, submissionId: submission.id })),
    });
    return tx.trialExamSubmission.update({
      where: { id: submission.id },
      data: {
        submittedAt: new Date(),
        totalScore,
        isPassed,
      },
    });
  });
}

export async function getTrialExamResult(trialSessionId: string, submissionId: string) {
  const result = await prisma.trialExamSubmission.findUnique({
    where: { id: submissionId },
    include: {
      exam: { select: { title: true, totalPoints: true, passingScore: true } },
      answers: {
        include: {
          question: {
            select: { questionText: true, type: true, points: true, correctAnswer: true, options: true },
          },
        },
      },
    },
  });

  if (!result) throw new AppError('Result not found.', 404);
  if (result.trialSessionId !== trialSessionId) throw new AppError('Unauthorized.', 403);
  return result;
}
