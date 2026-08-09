import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';
import { getLessonNavigation } from '../../shared/lesson-navigation.js';
function getPlaybackNotesClient() {
    const client = prisma.studentPlaybackNote;
    return client ?? null;
}
function isPlaybackNotesUnavailableError(error) {
    if (error instanceof TypeError)
        return true;
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    return code === 'P2021';
}
export function formatDuration(startTime, endTime) {
    const totalSeconds = Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
    const paddedSeconds = String(seconds).padStart(2, '0');
    return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${paddedMinutes}:${paddedSeconds}`;
}
async function assertCourseAccess(studentId, courseId) {
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
async function getStudentNotes(studentId, sourceType, sourceId) {
    const notesClient = getPlaybackNotesClient();
    if (!notesClient)
        return [];
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
    }
    catch (error) {
        if (isPlaybackNotesUnavailableError(error))
            return [];
        throw error;
    }
}
function mapLiveUpNextItem(item, currentId) {
    return {
        id: item.id,
        sourceType: 'LIVE_SESSION',
        lessonId: null,
        title: item.title,
        durationText: item.durationText,
        status: item.id === currentId ? 'CURRENT' : 'UPCOMING',
    };
}
async function buildLiveSessionUpNext(courseId, currentSessionId) {
    const sessions = await prisma.liveSession.findMany({
        where: {
            courseId,
            status: 'COMPLETED',
            recordingUrl: { not: null },
        },
        select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
        },
        orderBy: { endTime: 'asc' },
    });
    return sessions.map((session) => mapLiveUpNextItem({
        id: session.id,
        title: session.title || 'Recorded live session',
        durationText: formatDuration(session.startTime, session.endTime),
    }, currentSessionId));
}
export const getStudentRecordings = async (studentId) => {
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
    const liveAccessWhere = [
        ...(courseIds.length ? [{ type: 'GROUP', courseId: { in: courseIds } }] : []),
        { type: 'PRIVATE', studentId },
    ];
    const [liveSessions, recordedLessons] = await Promise.all([
        prisma.liveSession.findMany({
            where: {
                status: 'COMPLETED',
                recordingUrl: { not: null },
                OR: liveAccessWhere,
            },
            include: {
                course: {
                    select: { id: true, title: true, thumbnail: true },
                },
                instructor: { select: { id: true, fullName: true, avatar: true } },
            },
            orderBy: { endTime: 'desc' },
        }),
        courseIds.length
            ? prisma.lesson.findMany({
                where: {
                    videoUrl: { not: null },
                    section: { unit: { courseId: { in: courseIds } } },
                },
                select: {
                    id: true,
                    title: true,
                    order: true,
                    videoUrl: true,
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
            : Promise.resolve([]),
    ]);
    const liveRecordings = liveSessions
        .filter((session) => session.recordingUrl && session.recordingUrl.trim().length > 0)
        .map((session) => {
        const purchase = session.courseId ? purchaseByCourseId.get(session.courseId) : null;
        const course = session.course ?? purchase?.course ?? null;
        return {
            id: session.id,
            sourceType: 'LIVE_SESSION',
            title: session.title || course?.title || 'Recorded live session',
            description: session.description,
            recordingUrl: session.recordingUrl,
            videoUrl: session.recordingUrl,
            thumbnailUrl: course?.thumbnail ?? null,
            durationMinutes: Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000),
            durationText: formatDuration(session.startTime, session.endTime),
            recordedAt: session.endTime,
            startTime: session.startTime,
            endTime: session.endTime,
            courseId: course?.id ?? null,
            courseTitle: course?.title ?? null,
            instructor: session.instructor,
            lessonId: null,
            unitId: null,
            unitTitle: null,
        };
    });
    const lessonRecordings = recordedLessons
        .filter((lesson) => lesson.videoUrl && lesson.videoUrl.trim().length > 0)
        .map((lesson) => {
        const purchase = purchaseByCourseId.get(lesson.section.unit.course.id);
        return {
            id: lesson.id,
            sourceType: 'RECORDED_LESSON',
            title: `${lesson.section.unit.course.title} - Lesson ${lesson.order}: ${lesson.title}`,
            description: null,
            recordingUrl: lesson.videoUrl,
            videoUrl: lesson.videoUrl,
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
        recordings: [...liveRecordings, ...lessonRecordings],
        counts: {
            total: liveRecordings.length + lessonRecordings.length,
            liveSessions: liveRecordings.length,
            recordedLessons: lessonRecordings.length,
        },
    };
};
export const getRecordingDetail = async (studentId, sourceType, sourceId) => {
    if (sourceType === 'RECORDED_LESSON') {
        const lesson = await prisma.lesson.findUnique({
            where: { id: sourceId },
            select: {
                id: true,
                title: true,
                order: true,
                videoUrl: true,
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
        if (!lesson || !lesson.videoUrl?.trim()) {
            throw new AppError('Recording not found.', 404);
        }
        const courseId = lesson.section.unit.course.id;
        const purchase = await assertCourseAccess(studentId, courseId);
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
            sourceType: 'RECORDED_LESSON',
            lessonId: item.id,
            title: `Lesson ${item.order}: ${item.title}`,
            durationText: null,
            status: item.status,
        }));
        return {
            id: lesson.id,
            sourceType: 'RECORDED_LESSON',
            videoUrl: lesson.videoUrl,
            recordingUrl: lesson.videoUrl,
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
    }
    const session = await prisma.liveSession.findUnique({
        where: { id: sourceId },
        include: {
            course: {
                select: { id: true, title: true, thumbnail: true },
            },
            instructor: { select: { id: true, fullName: true, avatar: true } },
        },
    });
    if (!session || !session.recordingUrl?.trim() || session.status !== 'COMPLETED') {
        throw new AppError('Recording not found.', 404);
    }
    const courseId = session.courseId;
    if (!courseId) {
        throw new AppError('Recording is not linked to a course.', 400);
    }
    await assertCourseAccess(studentId, courseId);
    const [notes, upNext] = await Promise.all([
        getStudentNotes(studentId, 'LIVE_SESSION', session.id),
        buildLiveSessionUpNext(courseId, session.id),
    ]);
    return {
        id: session.id,
        sourceType: 'LIVE_SESSION',
        videoUrl: session.recordingUrl,
        recordingUrl: session.recordingUrl,
        thumbnailUrl: session.course?.thumbnail ?? null,
        courseId,
        courseTitle: session.course?.title ?? null,
        unitId: null,
        unitTitle: null,
        lessonId: null,
        title: session.title || session.course?.title || 'Recorded live session',
        subtitle: session.course?.title ?? null,
        description: session.description,
        durationMinutes: Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000),
        durationText: formatDuration(session.startTime, session.endTime),
        recordedAt: session.endTime,
        startTime: session.startTime,
        endTime: session.endTime,
        instructor: session.instructor,
        notes,
        notesEmptyMessage: 'No notes yet. Start taking notes while watching the video.',
        resources: [],
        upNext,
        progress: null,
        canTakeNotes: true,
    };
};
export const createPlaybackNote = async (studentId, sourceType, sourceId, data) => {
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
    }
    catch (error) {
        if (isPlaybackNotesUnavailableError(error)) {
            throw new AppError('Notes are not available yet. Please run the latest database migration.', 503);
        }
        throw error;
    }
};
export const updatePlaybackNote = async (studentId, sourceType, sourceId, noteId, data) => {
    const notesClient = getPlaybackNotesClient();
    if (!notesClient) {
        throw new AppError('Notes are not available yet. Please deploy the latest backend and run database migrations.', 503);
    }
    const note = (await notesClient.findUnique({ where: { id: noteId } }));
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
export const deletePlaybackNote = async (studentId, sourceType, sourceId, noteId) => {
    const notesClient = getPlaybackNotesClient();
    if (!notesClient) {
        throw new AppError('Notes are not available yet. Please deploy the latest backend and run database migrations.', 503);
    }
    const note = (await notesClient.findUnique({ where: { id: noteId } }));
    if (!note || note.studentId !== studentId || note.sourceType !== sourceType || note.sourceId !== sourceId) {
        throw new AppError('Note not found.', 404);
    }
    await notesClient.delete({ where: { id: noteId } });
    return { id: noteId, deleted: true };
};
//# sourceMappingURL=student-recording.service.js.map