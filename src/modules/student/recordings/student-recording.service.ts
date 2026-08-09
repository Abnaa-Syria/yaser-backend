import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';
import { getLessonNavigation } from '../../shared/lesson-navigation.js';
import { lessonHasVideo } from '../../shared/lesson-video.js';

type RecordingSourceType = 'RECORDED_LESSON';

type PlaybackNotesClient = {
  findMany: (args: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

function getPlaybackNotesClient(): PlaybackNotesClient | null {
  const client = (prisma as unknown as { studentPlaybackNote?: PlaybackNotesClient }).studentPlaybackNote;
  return client ?? null;
}

function isPlaybackNotesUnavailableError(error: unknown) {
  if (error instanceof TypeError) return true;
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
  return code === 'P2021';
}

async function assertCourseAccess(studentId: string, courseId: string) {
  await requireCourseAccess(studentId, courseId);

  const purchase = await prisma.coursePurchase.findFirst({
    where: { studentId, courseId },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          instructor: { select: { id: true, fullName: true, avatar: true } },
        },
      },
    },
  });

  if (!purchase) {
    throw new AppError('You do not have access to the course associated with this recording.', 403);
  }

  return purchase;
}

async function getStudentNotes(studentId: string, sourceType: RecordingSourceType, sourceId: string) {
  const notesClient = getPlaybackNotesClient();
  if (!notesClient) return [];

  try {
    return await notesClient.findMany({
      where: { studentId, sourceType, sourceId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        timestampSeconds: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error: unknown) {
    if (isPlaybackNotesUnavailableError(error)) return [];
    throw error;
  }
}

export const getStudentRecordings = async (studentId: string) => {
  const purchases = await prisma.coursePurchase.findMany({
    where: { studentId },
    select: {
      courseId: true,
      purchasedAt: true,
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          type: true,
          instructor: { select: { id: true, fullName: true, avatar: true } },
        },
      },
    },
    orderBy: { purchasedAt: 'desc' },
  });

  const courseIds = purchases.map((p) => p.courseId);
  const purchaseByCourseId = new Map(purchases.map((p) => [p.courseId, p]));

  const recordedLessons = courseIds.length
    ? await prisma.lesson.findMany({
        where: {
          deletedAt: null,
          OR: [{ videoUrl: { not: null } }, { vdoCipherVideoId: { not: null } }],
          section: { unit: { courseId: { in: courseIds } } },
        },
        select: {
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
              unit: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                  course: { select: { id: true, title: true, thumbnail: true } },
                },
              },
            },
          },
        },
        orderBy: [{ section: { unit: { order: 'asc' } } }, { section: { order: 'asc' } }, { order: 'asc' }],
      })
    : [];

  const lessonRecordings = recordedLessons
    .filter((lesson) => lessonHasVideo(lesson))
    .map((lesson) => {
      const purchase = purchaseByCourseId.get(lesson.section.unit.course.id);
      const hasVdoCipher = Boolean(lesson.vdoCipherVideoId?.trim());
      return {
        id: lesson.id,
        sourceType: 'RECORDED_LESSON' as const,
        title: `${lesson.section.unit.course.title} - Lesson ${lesson.order}: ${lesson.title}`,
        description: null,
        recordingUrl: hasVdoCipher ? null : lesson.videoUrl,
        videoUrl: hasVdoCipher ? null : lesson.videoUrl,
        vdoCipherVideoId: lesson.vdoCipherVideoId,
        hasVdoCipherVideo: hasVdoCipher,
        thumbnailUrl: lesson.section.unit.course.thumbnail,
        durationMinutes: null,
        durationText: null,
        recordedAt: null,
        startTime: null,
        endTime: null,
        courseId: lesson.section.unit.course.id,
        courseTitle: lesson.section.unit.course.title,
        instructor: purchase?.course.instructor ?? null,
        lessonId: lesson.id,
        unitId: lesson.section.unit.id,
        unitTitle: lesson.section.unit.title,
      };
    });

  return {
    recordings: lessonRecordings,
    counts: {
      total: lessonRecordings.length,
      recordedLessons: lessonRecordings.length,
    },
  };
};

export const getRecordingDetail = async (
  studentId: string,
  sourceType: RecordingSourceType,
  sourceId: string
) => {
  if (sourceType !== 'RECORDED_LESSON') {
    throw new AppError('Recording not found.', 404);
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      title: true,
      order: true,
      videoUrl: true,
      vdoCipherVideoId: true,
      section: {
        select: {
          id: true,
          title: true,
          unit: {
            select: {
              id: true,
              title: true,
              course: { select: { id: true, title: true, thumbnail: true } },
            },
          },
        },
      },
    },
  });

  if (!lesson || !lessonHasVideo(lesson)) {
    throw new AppError('Recording not found.', 404);
  }

  const courseId = lesson.section.unit.course.id;
  const purchase = await assertCourseAccess(studentId, courseId);
  const hasVdoCipher = Boolean(lesson.vdoCipherVideoId?.trim());

  const [resources, notes, progress, navigation] = await Promise.all([
    prisma.lessonResource.findMany({
      where: { lessonId: lesson.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, fileUrl: true, fileType: true, createdAt: true },
    }),
    getStudentNotes(studentId, 'RECORDED_LESSON', lesson.id),
    prisma.lessonProgress.findFirst({
      where: { studentId, lessonId: lesson.id, courseId },
      select: {
        isCompleted: true,
        watchPercentage: true,
        timeSpentSeconds: true,
        lastAccessedAt: true,
      },
    }),
    getLessonNavigation(courseId, lesson.id, studentId),
  ]);

  const upNext = navigation.playlist
    .filter((item) => item.hasVideo)
    .map((item) => ({
      id: item.id,
      sourceType: 'RECORDED_LESSON' as const,
      lessonId: item.id,
      title: `Lesson ${item.order}: ${item.title}`,
      durationText: null,
      status: item.status,
    }));

  return {
    id: lesson.id,
    sourceType: 'RECORDED_LESSON' as const,
    videoUrl: hasVdoCipher ? null : lesson.videoUrl,
    recordingUrl: hasVdoCipher ? null : lesson.videoUrl,
    vdoCipherVideoId: lesson.vdoCipherVideoId,
    hasVdoCipherVideo: hasVdoCipher,
    thumbnailUrl: lesson.section.unit.course.thumbnail,
    courseId,
    courseTitle: lesson.section.unit.course.title,
    unitId: lesson.section.unit.id,
    unitTitle: lesson.section.unit.title,
    lessonId: lesson.id,
    title: `Lesson ${lesson.order}: ${lesson.title}`,
    subtitle: lesson.section.unit.course.title,
    description: null,
    durationMinutes: null,
    durationText: null,
    instructor: purchase.course.instructor,
    notes,
    notesEmptyMessage: 'No notes yet. Start taking notes while watching the video.',
    resources,
    previous: navigation.previous,
    next: navigation.next,
    upNext,
    progress: {
      isCompleted: progress?.isCompleted ?? false,
      watchPercentage: progress?.watchPercentage ?? 0,
      timeSpentSeconds: progress?.timeSpentSeconds ?? 0,
      lastAccessedAt: progress?.lastAccessedAt ?? null,
    },
    canTakeNotes: true,
  };
};

export const createPlaybackNote = async (
  studentId: string,
  sourceType: RecordingSourceType,
  sourceId: string,
  data: { content: string; timestampSeconds?: number | null }
) => {
  await getRecordingDetail(studentId, sourceType, sourceId);

  const notesClient = getPlaybackNotesClient();
  if (!notesClient) {
    throw new AppError('Notes are not available yet. Please deploy the latest backend and run database migrations.', 503);
  }

  try {
    return await notesClient.create({
      data: {
        studentId,
        sourceType,
        sourceId,
        content: data.content.trim(),
        timestampSeconds: data.timestampSeconds ?? null,
      },
      select: {
        id: true,
        content: true,
        timestampSeconds: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error: unknown) {
    if (isPlaybackNotesUnavailableError(error)) {
      throw new AppError('Notes are not available yet. Please run the latest database migration.', 503);
    }
    throw error;
  }
};

export const updatePlaybackNote = async (
  studentId: string,
  sourceType: RecordingSourceType,
  sourceId: string,
  noteId: string,
  data: { content?: string; timestampSeconds?: number | null }
) => {
  const notesClient = getPlaybackNotesClient();
  if (!notesClient) {
    throw new AppError('Notes are not available yet. Please deploy the latest backend and run database migrations.', 503);
  }

  const note = (await notesClient.findUnique({ where: { id: noteId } })) as {
    studentId: string;
    sourceType: RecordingSourceType;
    sourceId: string;
  } | null;
  if (!note || note.studentId !== studentId || note.sourceType !== sourceType || note.sourceId !== sourceId) {
    throw new AppError('Note not found.', 404);
  }

  return notesClient.update({
    where: { id: noteId },
    data: {
      ...(data.content !== undefined ? { content: data.content.trim() } : {}),
      ...(data.timestampSeconds !== undefined ? { timestampSeconds: data.timestampSeconds } : {}),
    },
    select: {
      id: true,
      content: true,
      timestampSeconds: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const deletePlaybackNote = async (
  studentId: string,
  sourceType: RecordingSourceType,
  sourceId: string,
  noteId: string
) => {
  const notesClient = getPlaybackNotesClient();
  if (!notesClient) {
    throw new AppError('Notes are not available yet. Please deploy the latest backend and run database migrations.', 503);
  }

  const note = (await notesClient.findUnique({ where: { id: noteId } })) as {
    studentId: string;
    sourceType: RecordingSourceType;
    sourceId: string;
  } | null;
  if (!note || note.studentId !== studentId || note.sourceType !== sourceType || note.sourceId !== sourceId) {
    throw new AppError('Note not found.', 404);
  }

  await notesClient.delete({ where: { id: noteId } });
  return { id: noteId, deleted: true };
};
