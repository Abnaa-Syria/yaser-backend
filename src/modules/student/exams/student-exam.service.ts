import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';
import * as performanceService from '../../performance/performance.service.js';

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

  const lessons = await prisma.lesson.findMany({
    where: exam.unitId
      ? { section: { unitId: exam.unitId } }
      : {
          section: {
            unit: {
              courseId: exam.courseId || exam.unit?.courseId || exam.lesson?.section?.unit?.courseId,
            },
          },
        },
    orderBy: [{ section: { unit: { order: 'asc' } } }, { section: { order: 'asc' } }, { order: 'asc' }],
    select: { title: true, order: true },
  });

  return lessons.map((lesson) => `Lesson ${lesson.order}: ${lesson.title}`);
}

async function shapeExamDetailsForStudent(exam: any, mySubmission: any) {
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

/**
 * List exams available for the student
 */
export const getAvailableExams = async (
  studentId: string,
  filters: { courseId?: string; unitId?: string; lessonId?: string } = {}
) => {
  const purchases = await prisma.coursePurchase.findMany({
    where: {
      studentId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { courseId: true },
  });

  const courseIds = purchases.map((e) => e.courseId);
  if (filters.courseId && !courseIds.includes(filters.courseId)) {
    return [];
  }

  const authorizedCourseIds = filters.courseId ? [filters.courseId] : courseIds;
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
    orderBy: { createdAt: 'desc' }
  });

  if (exams.length === 0) return [];

  const examIds = exams.map((e) => e.id);
  const submissions = await prisma.examSubmission.findMany({
    where: { studentId, examId: { in: examIds } },
    select: {
      id: true,
      examId: true,
      startedAt: true,
      submittedAt: true,
      totalScore: true,
      isPassed: true,
    },
  });
  const submissionByExam = new Map(submissions.map((s) => [s.examId, s]));

  return exams.map((exam) => ({
    ...exam,
    mySubmission: submissionByExam.get(exam.id) ?? null,
  }));
};

/**
 * Get exam details (Safe version - no correct answers)
 */
export const getExamDetails = async (studentId: string, examId: string) => {
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
          options: true
          // Exclude correctAnswer
        }
      }
    }
  });

  if (!exam) throw new AppError('Exam not found.', 404);

  // Check enrollment (Deep check) - only if exam is linked to a course
  const courseId = exam.courseId || exam.unit?.courseId || exam.lesson?.section?.unit?.courseId;
  if (courseId) {
    await requireCourseAccess(studentId, courseId);
  }

  const mySubmission = await prisma.examSubmission.findFirst({
    where: { studentId, examId: exam.id },
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

  return shapeExamDetailsForStudent(exam, mySubmission);
};

/**
 * Start an exam (Initialize submission)
 */
export const startExam = async (studentId: string, examId: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      unit: { select: { courseId: true } },
      lesson: { include: { section: { select: { unit: { select: { courseId: true } } } } } },
    },
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  if (exam.status === 'UPCOMING' || exam.status === 'EXPIRED') {
    throw new AppError(`Cannot start exam. The exam is currently ${exam.status.toLowerCase()}.`, 400);
  }

  const courseId = exam.courseId || exam.unit?.courseId || exam.lesson?.section?.unit?.courseId;
  if (courseId) {
    await requireCourseAccess(studentId, courseId);
  }

  const activeSubmission = await prisma.examSubmission.findFirst({
    where: { studentId, examId, submittedAt: null },
    orderBy: { attempt: 'desc' },
  });
  if (activeSubmission) return activeSubmission;

  const latestSubmission = await prisma.examSubmission.findFirst({
    where: { studentId, examId },
    orderBy: { attempt: 'desc' },
    select: { attempt: true },
  });
  const nextAttempt = (latestSubmission?.attempt ?? 0) + 1;

  try {
    const submission = await prisma.examSubmission.create({
      data: {
        studentId,
        examId,
        attempt: nextAttempt,
        startedAt: new Date(),
      },
    });
    return submission;
  } catch (error: any) {
    if (error.code === 'P2002') {
      return await prisma.examSubmission.findFirst({
        where: { studentId, examId, submittedAt: null },
        orderBy: { attempt: 'desc' },
      });
    }
    throw error;
  }
};

/**
 * Submit exam and auto-grade
 */
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

export const submitExam = async (studentId: string, examId: string, answers: SubmitExamAnswerInput[]) => {
  const submission = await prisma.examSubmission.findFirst({
    where: { studentId, examId, submittedAt: null },
    orderBy: { attempt: 'desc' },
    include: { exam: { include: { questions: true } } },
  });

  if (!submission) throw new AppError('Submission not found. Did you start the exam?', 404);
  if (submission.submittedAt) throw new AppError('Exam already submitted.', 400);
  if (submission.exam.status !== 'AVAILABLE') {
    throw new AppError(`Cannot submit exam. The exam is currently ${submission.exam.status.toLowerCase()}.`, 400);
  }

  // Time Limit Enforcement
  const now = Date.now();
  const startedAt = submission.startedAt.getTime();
  const elapsedMinutes = (now - startedAt) / (1000 * 60);
  
  // Enforce duration limit with a 2-minute grace period for network latency
  const allowedMinutes = submission.exam.durationMinutes + 2;

  if (elapsedMinutes > allowedMinutes) {
    throw new AppError(`Exam time expired. Allowed: ${submission.exam.durationMinutes}m. Elapsed: ${Math.floor(elapsedMinutes)}m.`, 400);
  }

  let totalScore = 0;

  // Grade each answer
  const gradedAnswers = submission.exam.questions.map(question => {
    const studentAnswer = answers.find(a => a.questionId === question.id);
    const selectedOptionId = studentAnswer?.optionId;
    if ((question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') && selectedOptionId) {
      if (!questionHasOption(question, selectedOptionId)) {
        throw new AppError('Invalid option selected for one or more questions.', 400);
      }
    }
    const answerText = selectedOptionId || studentAnswer?.answerText || null;
    
    let isCorrect = null;
    let pointsEarned = 0;

    // Auto-grade logic
    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
      isCorrect = answerText === question.correctAnswer;
      pointsEarned = isCorrect ? question.points : 0;
    }
    
    if (isCorrect) totalScore += pointsEarned;

    return {
      questionId: question.id,
      answerText,
      isCorrect,
      pointsEarned
    };
  });

  const isPassed = totalScore >= submission.exam.passingScore;

  // Transaction to save answers and update submission
  const finalSubmission = await prisma.$transaction(async (tx) => {
    // Delete existing answers if any (to prevent duplicates on retry)
    await tx.examAnswer.deleteMany({ where: { submissionId: submission.id } });

    // Create new answers
    await tx.examAnswer.createMany({
      data: gradedAnswers.map(a => ({ ...a, submissionId: submission.id }))
    });

    // Update submission
    return await tx.examSubmission.update({
      where: { id: submission.id },
      data: {
        submittedAt: new Date(),
        totalScore,
        isPassed
      }
    });
  });

  // 4. Update Student Performance (Async)
  const courseId = await performanceService.getCourseIdFromExam(examId);
  if (courseId) {
    performanceService.updateStudentPerformance(studentId, courseId).catch(err => {
      console.error(`Failed to update performance for student ${studentId} in course ${courseId}:`, err);
    });
  }

  // 5. Gamification XP (non-blocking for response shape)
  let xp = null;
  try {
    const { awardExamXp } = await import('../gamification/gamification.service.js');
    xp = await awardExamXp(studentId, finalSubmission.id, {
      score: totalScore,
      passingScore: submission.exam.passingScore,
      totalPoints: submission.exam.totalPoints || submission.exam.passingScore || 1,
      courseId: courseId || undefined,
      passed: isPassed,
    });
  } catch (err) {
    console.error('[gamification] exam XP failed', err);
  }

  return { ...finalSubmission, xp };
};


/**
 * Get results for a submission
 */
export const getSubmissionResult = async (studentId: string, submissionId: string) => {
  const result = await prisma.examSubmission.findUnique({
    where: { id: submissionId },
    include: {
      exam: { select: { title: true, totalPoints: true, passingScore: true } },
      answers: {
        include: { question: { select: { questionText: true, type: true, points: true, correctAnswer: true, options: true } } }
      }
    }
  });

  if (!result) throw new AppError('Result not found.', 404);
  if (result.studentId !== studentId) throw new AppError('Unauthorized.', 403);

  const ledger = await prisma.xpLedger.findFirst({
    where: { userId: studentId, sourceType: 'EXAM', sourceId: submissionId },
    select: { amount: true },
  });

  return {
    ...result,
    xp: ledger ? { awarded: true, amount: ledger.amount } : null,
  };
};

