import { prisma } from '../../prisma.js';
const lessonWithHierarchySelect = {
    id: true,
    title: true,
    order: true,
    videoUrl: true,
    section: {
        select: {
            id: true,
            title: true,
            order: true,
            unit: { select: { id: true, title: true, order: true } },
        },
    },
};
function shapeLessonNavItem(lesson, currentLessonId, completedLessonIds) {
    let status = 'UPCOMING';
    if (lesson.id === currentLessonId)
        status = 'CURRENT';
    else if (completedLessonIds.has(lesson.id))
        status = 'COMPLETED';
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
        hasVideo: Boolean(lesson.videoUrl?.trim()),
        status,
    };
}
export async function getCourseLessonsOrdered(courseId) {
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
export async function getLessonNavigation(courseId, currentLessonId, studentId, _legacyCohortId) {
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
    const previous = currentIndex > 0
        ? shapeLessonNavItem(lessons[currentIndex - 1], currentLessonId, completedLessonIds)
        : null;
    const next = currentIndex >= 0 && currentIndex < lessons.length - 1
        ? shapeLessonNavItem(lessons[currentIndex + 1], currentLessonId, completedLessonIds)
        : null;
    const playlist = lessons.map((lesson) => shapeLessonNavItem(lesson, currentLessonId, completedLessonIds));
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
                hasVideo: Boolean(current.videoUrl?.trim()),
            }
            : null,
        previous,
        next,
        playlist,
    };
}
//# sourceMappingURL=lesson-navigation.js.map