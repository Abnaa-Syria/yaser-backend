import { prisma } from '../../../prisma.js';
export async function listMyFlashcards(studentId, query) {
    const now = new Date();
    const accessWhere = {
        studentId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
    if (query.courseId)
        accessWhere.courseId = query.courseId;
    const purchases = await prisma.coursePurchase.findMany({
        where: accessWhere,
        select: { courseId: true },
    });
    const allowedCourseIds = purchases.map((purchase) => purchase.courseId);
    if (allowedCourseIds.length === 0)
        return [];
    const where = {
        status: 'PUBLISHED',
        lesson: {
            deletedAt: null,
            status: 'PUBLISHED',
            section: {
                deletedAt: null,
                unit: {
                    courseId: { in: allowedCourseIds },
                    status: 'PUBLISHED',
                },
            },
        },
    };
    if (query.lessonId)
        where.lessonId = query.lessonId;
    if (query.unitId || query.courseId) {
        where.lesson = {
            ...where.lesson,
            section: {
                deletedAt: null,
                unit: {
                    ...(query.unitId ? { id: query.unitId } : {}),
                    courseId: { in: allowedCourseIds },
                    status: 'PUBLISHED',
                },
            },
        };
    }
    return prisma.flashcard.findMany({
        where,
        orderBy: [{ lessonId: 'asc' }, { displayOrder: 'asc' }],
        select: {
            id: true,
            lessonId: true,
            front: true,
            frontAr: true,
            back: true,
            backAr: true,
            explanation: true,
            explanationAr: true,
            displayOrder: true,
            lesson: {
                select: {
                    id: true,
                    title: true,
                    titleAr: true,
                    section: {
                        select: {
                            id: true,
                            title: true,
                            unit: { select: { id: true, title: true, titleAr: true, courseId: true } },
                        },
                    },
                },
            },
        },
    });
}
//# sourceMappingURL=student-flashcard.service.js.map