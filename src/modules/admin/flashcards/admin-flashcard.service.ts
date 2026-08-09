import type { Prisma, PublishStatus } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

type FlashcardInput = {
  lessonId: string;
  front: string;
  frontAr?: string;
  back: string;
  backAr?: string;
  explanation?: string;
  explanationAr?: string;
  displayOrder?: number;
  status?: PublishStatus;
};

export async function listFlashcards(query: {
  courseId?: string;
  unitId?: string;
  lessonId?: string;
  status?: PublishStatus;
}) {
  const where: Prisma.FlashcardWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.lessonId) where.lessonId = query.lessonId;
  if (query.courseId || query.unitId) {
    where.lesson = {
      section: {
        unit: {
          ...(query.unitId ? { id: query.unitId } : {}),
          ...(query.courseId ? { courseId: query.courseId } : {}),
        },
      },
    };
  }

  return prisma.flashcard.findMany({
    where,
    orderBy: [{ lessonId: 'asc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          section: { select: { id: true, title: true, unit: { select: { id: true, title: true, courseId: true } } } },
        },
      },
    },
  });
}

export async function createFlashcard(data: FlashcardInput, createdById?: string) {
  await assertLessonExists(data.lessonId);
  return prisma.flashcard.create({
    data: {
      ...data,
      front: data.front.trim(),
      back: data.back.trim(),
      createdById,
    },
  });
}

export async function updateFlashcard(id: string, data: Partial<FlashcardInput>) {
  const existing = await prisma.flashcard.findUnique({ where: { id } });
  if (!existing) throw new AppError('Flashcard not found.', 404);
  if (data.lessonId) await assertLessonExists(data.lessonId);

  return prisma.flashcard.update({
    where: { id },
    data,
  });
}

export async function deleteFlashcard(id: string) {
  const existing = await prisma.flashcard.findUnique({ where: { id } });
  if (!existing) throw new AppError('Flashcard not found.', 404);
  await prisma.flashcard.delete({ where: { id } });
  return { id, deleted: true };
}

async function assertLessonExists(lessonId: string) {
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } });
  if (!lesson) throw new AppError('Lesson not found.', 404);
}
