import { prisma } from '../../prisma.js';
import { lessonHasVideo } from './lesson-video.js';

export type LessonNavItem = {
  id: string;
  title: string;
  order: number;
  sectionId: string;
  sectionTitle: string;
  sectionOrder: number;
  unitId: string;
  unitTitle: string;
  unitOrder: number;
  hasVideo: boolean;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING';
};

const lessonWithHierarchySelect = {
  id: true,
  title: true,
  order: true,
  videoUrl: true,
  vdoCipherVideoId: true,
  section: {
    select: {
      id: true,
      title: true,
      order: true,
      unit: { select: { id: true, title: true, order: true } },
    },
  },
} as const;

function shapeLessonNavItem(
  lesson: {
    id: string;
    title: string;
    order: number;
    videoUrl: string | null;
    vdoCipherVideoId: string | null;
    section: {
      id: string;
      title: string;
      order: number;
      unit: { id: string; title: string; order: number };
    };
  },
  currentLessonId: string,
  completedLessonIds: Set<string>
): LessonNavItem {
  let status: LessonNavItem['status'] = 'UPCOMING';
  if (lesson.id === currentLessonId) status = 'CURRENT';
  else if (completedLessonIds.has(lesson.id)) status = 'COMPLETED';

  return {
    id: lesson.id,
    title: lesson.title,
    order: lesson.order,
    sectionId: lesson.section.id,
    sectionTitle: lesson.section.title,
    sectionOrder: lesson.section.order,
    unitId: lesson.section.unit.id,
    unitTitle: lesson.section.unit.title,
    unitOrder: lesson.section.unit.order,
    hasVideo: lessonHasVideo(lesson),
    status,
  };
}

export async function getCourseLessonsOrdered(courseId: string) {
  return prisma.lesson.findMany({
    where: {
      deletedAt: null,
      section: { deletedAt: null, unit: { courseId } },
    },
    select: lessonWithHierarchySelect,
    orderBy: [
      { section: { unit: { order: 'asc' } } },
      { section: { order: 'asc' } },
      { order: 'asc' },
    ],
  });
}

export async function getLessonNavigation(
  courseId: string,
  currentLessonId: string,
  studentId?: string,
  _legacyCohortId?: string | null
) {
  const [lessons, progressRows] = await Promise.all([
    getCourseLessonsOrdered(courseId),
    studentId
      ? prisma.lessonProgress.findMany({
          where: { studentId, courseId, isCompleted: true },
          select: { lessonId: true },
        })
      : Promise.resolve([]),
  ]);

  const completedLessonIds = new Set(progressRows.map((row) => row.lessonId));
  const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId);
  const current = currentIndex >= 0 ? lessons[currentIndex] : null;

  const previous =
    currentIndex > 0
      ? shapeLessonNavItem(lessons[currentIndex - 1], currentLessonId, completedLessonIds)
      : null;
  const next =
    currentIndex >= 0 && currentIndex < lessons.length - 1
      ? shapeLessonNavItem(lessons[currentIndex + 1], currentLessonId, completedLessonIds)
      : null;

  const playlist = lessons.map((lesson) =>
    shapeLessonNavItem(lesson, currentLessonId, completedLessonIds)
  );

  return {
    lesson: current
      ? {
          id: current.id,
          title: current.title,
          order: current.order,
          sectionId: current.section.id,
          sectionTitle: current.section.title,
          sectionOrder: current.section.order,
          unitId: current.section.unit.id,
          unitTitle: current.section.unit.title,
          unitOrder: current.section.unit.order,
          hasVideo: lessonHasVideo(current),
        }
      : null,
    previous,
    next,
    playlist,
  };
}
