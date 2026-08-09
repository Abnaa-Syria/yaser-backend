import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';
import { getLessonNavigation } from '../../shared/lesson-navigation.js';

export const getLessonResources = async (userId: string, lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        select: {
          id: true,
          title: true,
          order: true,
          unitId: true,
          unit: {
            select: {
              id: true,
              title: true,
              order: true,
              courseId: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  if (!lesson) throw new AppError('Lesson not found', 404);

  const courseId = lesson.section.unit.courseId;
  await requireCourseAccess(userId, courseId);

  const [resources, navigation] = await Promise.all([
    prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, fileUrl: true, fileType: true, createdAt: true },
    }),
    getLessonNavigation(courseId, lessonId, userId),
  ]);

  return {
    lesson: {
      ...navigation.lesson,
      courseId: lesson.section.unit.course.id,
      courseTitle: lesson.section.unit.course.title,
    },
    resources,
    previous: navigation.previous,
    next: navigation.next,
    playlist: navigation.playlist,
  };
};
