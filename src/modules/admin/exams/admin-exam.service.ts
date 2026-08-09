import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';


/**
 * Create a new exam (Admin)
 */
export const createExam = async (data: any) => {
  const { courseId, unitId, lessonId } = data;

  // 1. Validation: Only one parent allowed
  const parentsCount = [courseId, unitId, lessonId].filter(Boolean).length;
  if (parentsCount > 1) {
    throw new AppError('An exam can only belong to one parent (Course, Unit, or Lesson)', 400);
  }

  const exam = await prisma.exam.create({
    data: {
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      durationMinutes: Number(data.durationMinutes),
      totalPoints: Number(data.totalPoints),
      passingScore: Number(data.passingScore),
      type: data.type || 'STANDALONE',
      status: data.status || 'UPCOMING',
      coveredTopics: data.coveredTopics || [],
      examStructure: data.examStructure || [],
      importantInstructions: data.importantInstructions || [],
      preparationTips: data.preparationTips || [],
      readyMessage: data.readyMessage || null,
      courseId: courseId || null,
      unitId: unitId || null,
      lessonId: lessonId || null,
      targetLevels: data.targetLevels ? (data.targetLevels as any) : null,
      questions: data.questions && Array.isArray(data.questions) ? {
        create: data.questions.map((q: any, index: number) => ({
          questionText: q.questionText,
          type: q.type || 'MULTIPLE_CHOICE',
          points: Number(q.points) || 10,
          order: index + 1,
          options: q.options || [],
          correctAnswer: String(q.correctAnswer)
        }))
      } : undefined
    }
  });
  return exam;
};


/**
 * Update exam info (Admin)
 */
export const updateExam = async (examId: string, data: any) => {
  const updatedExam = await prisma.exam.update({
    where: { id: examId },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
    }
  });
  return updatedExam;
};

/**
 * Delete exam (Admin)
 */
export const deleteExam = async (examId: string) => {
  await prisma.exam.delete({ where: { id: examId } });
  return { id: examId, deleted: true };
};

/**
 * Add question to exam (Admin)
 */
export const addQuestion = async (examId: string, data: any) => {
  const question = await prisma.examQuestion.create({
    data: {
      examId,
      questionText: data.questionText,
      type: data.type,
      points: data.points,
      order: data.order,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation || null,
      explanationAr: data.explanationAr || null,
      imageUrl: data.imageUrl || null,
    }
  });
  return question;
};

/**
 * Update question (Admin)
 */
export const updateQuestion = async (questionId: string, data: any) => {
  const updatedQuestion = await prisma.examQuestion.update({
    where: { id: questionId },
    data
  });
  return updatedQuestion;
};

/**
 * Remove question (Admin)
 */
export const removeQuestion = async (questionId: string) => {
  await prisma.examQuestion.delete({
    where: { id: questionId }
  });
  return { id: questionId, deleted: true };
};

/**
 * List all exams with filtering and pagination
 */
export const getAllExams = async (options: {
  page: number;
  limit: number;
  courseId?: string;
  unitId?: string;
  lessonId?: string;
  type?: string;
  status?: string;
}) => {
  const { page, limit, courseId, unitId, lessonId, type, status } = options;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;

  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (courseId) where.courseId = courseId;
  if (unitId) where.unitId = unitId;
  if (lessonId) where.lessonId = lessonId;
  if (type) where.type = type;
  if (status) where.status = status;


  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        course: { select: { title: true } },
        unit: { select: { title: true } },
        lesson: { select: { title: true } },
        _count: { select: { questions: true, submissions: true } }
      },

      orderBy: { createdAt: 'desc' }
    }),
    prisma.exam.count({ where })
  ]);

  return {
    exams,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single exam with questions
 */
export const getExamById = async (id: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      unit: { select: { id: true, title: true } },
      lesson: { select: { id: true, title: true } },

      questions: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!exam) {
    throw new Error('Exam not found');
  }

  return exam;
};

/**
 * List submissions for a specific exam
 */
export const getExamSubmissions = async (examId: string, options: { page?: number; limit?: number } = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 50;
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    prisma.examSubmission.findMany({
      where: { examId },
      skip,
      take: limit,
      include: {
        student: { select: { id: true, fullName: true, email: true, avatar: true } },
        exam: { select: { id: true, title: true, totalPoints: true, passingScore: true } },
      },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.examSubmission.count({ where: { examId } }),
  ]);

  return { submissions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};
