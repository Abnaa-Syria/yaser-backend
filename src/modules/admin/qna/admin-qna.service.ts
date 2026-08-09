import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

export const replyToQuestion = async (adminId: string, questionId: string, body: string) => {
  const question = await prisma.lessonQuestion.findUnique({
    where: { id: questionId },
    include: {
      student: { select: { fullName: true } },
      lesson: {
        include: {
          section: {
            select: {
              unit: {
                select: {
                  courseId: true,
                  course: { select: { title: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!question) throw new AppError('Question not found', 404);

  const answer = await prisma.lessonAnswer.create({
    data: {
      questionId,
      userId: adminId,
      body,
      isInstructorReply: true,
    },
  });

  try {
    const courseTitle = question.lesson.section.unit.course.title;
    await prisma.notification.create({
      data: {
        userId: question.studentId,
        type: 'GENERAL',
        title: 'رد جديد على سؤالك',
        message: `تم الرد على سؤالك في درس "${question.lesson.title}" ضمن كورس "${courseTitle}"`,
      },
    });
  } catch (notifErr) {
    console.error('Failed to create admin Q&A reply notification:', notifErr);
  }

  return answer;
};

export const toggleResolve = async (questionId: string) => {
  const question = await prisma.lessonQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, isResolved: true },
  });

  if (!question) throw new AppError('Question not found', 404);

  return prisma.lessonQuestion.update({
    where: { id: questionId },
    data: { isResolved: !question.isResolved },
  });
};

export const listAdminQuestions = async (query: {
  courseId?: string;
  lessonId?: string;
  page?: number;
  limit?: number;
  resolved?: string;
  search?: string;
}) => {
  const pageNum = Number(query.page) || 1;
  const limitNum = Math.min(Number(query.limit) || 20, 100);
  const skip = (pageNum - 1) * limitNum;

  const and: Record<string, unknown>[] = [];
  if (query.courseId) and.push({ lesson: { section: { unit: { courseId: query.courseId } } } });
  if (query.lessonId) and.push({ lessonId: query.lessonId });
  if (query.resolved !== undefined) {
    and.push({ isResolved: query.resolved === 'true' });
  }
  if (query.search?.trim()) {
    const q = query.search.trim();
    and.push({
      OR: [
        { title: { contains: q } },
        { body: { contains: q } },
        { student: { fullName: { contains: q } } },
        { student: { email: { contains: q } } },
      ],
    });
  }

  const where = and.length ? { AND: and } : {};

  const [questions, total] = await Promise.all([
    prisma.lessonQuestion.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, fullName: true, email: true, avatar: true } },
        lesson: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                unit: {
                  select: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                        instructor: { select: { id: true, fullName: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        answers: {
          include: { user: { select: { id: true, fullName: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.lessonQuestion.count({ where }),
  ]);

  return {
    questions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};
