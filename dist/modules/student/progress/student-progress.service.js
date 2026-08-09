import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';
export const calculateCourseProgress = async (studentId, courseId, txClient) => {
    const db = txClient || prisma;
    const purchase = await db.coursePurchase.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (!purchase)
        throw new AppError('Course purchase not found', 404);
    const totalLessons = await db.lesson.count({
        where: { section: { unit: { courseId } } },
    });
    const completedCount = await db.lessonProgress.count({
        where: {
            studentId,
            courseId,
            isCompleted: true,
            lesson: { section: { unit: { courseId } } },
        },
    });
    const percentage = totalLessons === 0 ? 0 : (completedCount / totalLessons) * 100;
    const isNowFinished = totalLessons > 0 && percentage >= 100;
    const updated = await db.coursePurchase.update({
        where: { studentId_courseId: { studentId, courseId } },
        data: {
            completedLessonsCount: completedCount,
            progressPercentage: Math.round(percentage * 100) / 100,
            isCompleted: isNowFinished,
        },
    });
    return { ...updated, totalLessons };
};
/** @deprecated Use calculateCourseProgress */
export const calculateCohortProgress = calculateCourseProgress;
export const completeLesson = async (userId, lessonId, courseId) => {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { section: { select: { unit: { select: { courseId: true } } } } },
    });
    if (!lesson)
        throw new AppError('Lesson not found', 404);
    const resolvedCourseId = courseId ?? lesson.section.unit.courseId;
    return prisma.$transaction(async (tx) => {
        await requireCourseAccess(userId, resolvedCourseId);
        const existingProgress = await tx.lessonProgress.findFirst({
            where: { studentId: userId, lessonId, courseId: resolvedCourseId },
        });
        if (existingProgress?.isCompleted) {
            return existingProgress;
        }
        const updatedProgress = await tx.lessonProgress.upsert({
            where: {
                studentId_lessonId_courseId: {
                    studentId: userId,
                    lessonId,
                    courseId: resolvedCourseId,
                },
            },
            update: {
                isCompleted: true,
                completedAt: new Date(),
                lastAccessedAt: new Date(),
                watchPercentage: 100,
            },
            create: {
                studentId: userId,
                lessonId,
                courseId: resolvedCourseId,
                isCompleted: true,
                completedAt: new Date(),
                lastAccessedAt: new Date(),
                watchPercentage: 100,
            },
        });
        await calculateCourseProgress(userId, resolvedCourseId, tx);
        return updatedProgress;
    });
};
export const trackAccess = async (userId, lessonId, watchPercentage = 0, courseId) => {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { section: { select: { unit: { select: { courseId: true } } } } },
    });
    if (!lesson)
        throw new AppError('Lesson not found', 404);
    const resolvedCourseId = courseId ?? lesson.section.unit.courseId;
    await requireCourseAccess(userId, resolvedCourseId);
    return prisma.lessonProgress.upsert({
        where: {
            studentId_lessonId_courseId: {
                studentId: userId,
                lessonId,
                courseId: resolvedCourseId,
            },
        },
        update: {
            lastAccessedAt: new Date(),
            timeSpentSeconds: { increment: 10 },
            ...(watchPercentage > 0 ? { watchPercentage } : {}),
        },
        create: {
            studentId: userId,
            lessonId,
            courseId: resolvedCourseId,
            isCompleted: false,
            watchPercentage: watchPercentage > 0 ? watchPercentage : 0,
        },
    });
};
export const listCompletedLessonIds = async (userId, courseId) => {
    await requireCourseAccess(userId, courseId);
    const rows = await prisma.lessonProgress.findMany({
        where: { studentId: userId, courseId, isCompleted: true },
        select: { lessonId: true },
    });
    return rows.map((r) => r.lessonId);
};
export const resumeCourse = async (userId, courseId) => {
    await requireCourseAccess(userId, courseId);
    const firstIncomplete = await prisma.lesson.findFirst({
        where: {
            section: { unit: { courseId } },
            progress: {
                none: { studentId: userId, courseId, isCompleted: true },
            },
        },
        orderBy: [{ section: { unit: { order: 'asc' } } }, { section: { order: 'asc' } }, { order: 'asc' }],
    });
    if (firstIncomplete) {
        return {
            lessonId: firstIncomplete.id,
            title: firstIncomplete.title,
            strategy: 'FIRST_INCOMPLETE',
        };
    }
    const lastAccessed = await prisma.lessonProgress.findFirst({
        where: { studentId: userId, courseId, lesson: { section: { unit: { courseId } } } },
        orderBy: { lastAccessedAt: 'desc' },
        include: { lesson: { select: { title: true } } },
    });
    if (lastAccessed) {
        return {
            lessonId: lastAccessed.lessonId,
            title: lastAccessed.lesson.title,
            strategy: 'LAST_ACCESSED',
        };
    }
    const startLesson = await prisma.lesson.findFirst({
        where: { section: { unit: { courseId } } },
        orderBy: [{ section: { unit: { order: 'asc' } } }, { section: { order: 'asc' } }, { order: 'asc' }],
    });
    return {
        lessonId: startLesson?.id || null,
        title: startLesson?.title || null,
        strategy: 'COURSE_START',
    };
};
//# sourceMappingURL=student-progress.service.js.map