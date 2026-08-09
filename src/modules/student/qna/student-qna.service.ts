import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';

export const getLessonQuestions = async (studentId: string, lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { unit: { select: { courseId: true } } } } },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);

  await requireCourseAccess(studentId, lesson.section.unit.courseId);

  return prisma.lessonQuestion.findMany({
    where: { lessonId },
    include: {
      student: { select: { fullName: true, avatar: true } },
      answers: {
        include: { user: { select: { fullName: true, avatar: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createQuestion = async (studentId: string, lessonId: string, data: { title: string; body: string }) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { unit: { select: { courseId: true } } } } },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);

  await requireCourseAccess(studentId, lesson.section.unit.courseId);

  return prisma.lessonQuestion.create({
    data: {
      studentId,
      lessonId,
      ...data,
    },
  });
};

export const createAnswer = async (studentId: string, questionId: string, body: string) => {
  const question = await prisma.lessonQuestion.findUnique({
    where: { id: questionId },
    include: { lesson: { include: { section: { select: { unit: { select: { courseId: true } } } } } } },
  });
  if (!question) throw new AppError('Question not found', 404);

  await requireCourseAccess(studentId, question.lesson.section.unit.courseId);

  return prisma.lessonAnswer.create({
    data: {
      questionId,
      userId: studentId,
      body,
      isInstructorReply: false,
    },
  });
};

export const getMyQuestions = async (studentId: string) => {
  return prisma.lessonQuestion.findMany({
    where: { studentId },
    include: {
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
                    },
                  },
                },
              },
            },
          },
        },
      },
      answers: {
        include: {
          user: {
            select: {
              fullName: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};
