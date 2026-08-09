import { prisma } from '../../../prisma.js';
import { notDeleted } from '../../../utils/soft-delete.js';

/**
 * Create a new lesson within a section
 */
export const createLesson = async (data: { 
  title: string; 
  order: number; 
  sectionId: string;
  meetingUrl?: string | null;
  availableAt?: string | Date | null;
  durationSeconds?: number;
  videoUrl?: string | null;
  vdoCipherVideoId?: string | null;
}) => {
  const lesson = await prisma.lesson.create({
    data: {
      title: data.title,
      order: data.order,
      sectionId: data.sectionId,
      meetingUrl: data.meetingUrl ?? null,
      availableAt: data.availableAt ? new Date(data.availableAt) : null,
      durationSeconds: data.durationSeconds ?? 0,
      videoUrl: data.videoUrl ?? null,
      vdoCipherVideoId: data.vdoCipherVideoId ?? null,
    },
    select: {
      id: true,
      title: true,
      order: true,
      sectionId: true,
      videoUrl: true,
      vdoCipherVideoId: true,
      meetingUrl: true,
      availableAt: true,
      durationSeconds: true,
    },
  });
  return lesson;
};

/**
 * Update lesson details
 */
export const updateLesson = async (id: string, data: { 
  title?: string; 
  order?: number; 
  videoUrl?: string | null;
  vdoCipherVideoId?: string | null;
  meetingUrl?: string | null;
  availableAt?: string | Date | null;
  durationSeconds?: number;
}) => {
  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      ...data,
      availableAt: data.availableAt ? new Date(data.availableAt) : data.availableAt,
    },
    select: {
      id: true,
      title: true,
      order: true,
      videoUrl: true,
      vdoCipherVideoId: true,
      meetingUrl: true,
      availableAt: true,
      durationSeconds: true,
    },
  });
  return lesson;
};

/**
 * Delete a lesson
 */
export const deleteLesson = async (id: string) => {
  await prisma.lesson.delete({ where: { id } });

  return { id, deleted: true };
};

export const getAllLessons = async (options: any) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const { unitId } = options;
  const skip = (page - 1) * limit;

  const where: any = notDeleted();
  if (unitId) where.section = { unitId };

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where,
      skip,
      take: limit,
      include: {
        section: {
          select: {
            title: true,
            unit: { select: { title: true, course: { select: { title: true } } } },
          },
        },
      },
      orderBy: [{ section: { unit: { order: 'asc' } } }, { section: { order: 'asc' } }, { order: 'asc' }],
    }),
    prisma.lesson.count({ where }),
  ]);

  return { lessons, total, page, limit };
};

export const getLessonById = async (id: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      section: { include: { unit: { include: { course: true } } } },
      resources: true,
      exams: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!lesson) throw new Error('Lesson not found');
  return lesson;
};
