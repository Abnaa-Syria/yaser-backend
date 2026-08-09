import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { hasCourseAccess } from '../../../utils/subscriptionValidator.js';
const linkedContentInclude = {
    course: {
        select: { id: true, title: true, titleAr: true, slug: true, thumbnail: true },
    },
    unit: {
        select: { id: true, title: true, titleAr: true, slug: true, courseId: true },
    },
    lesson: {
        select: {
            id: true,
            title: true,
            titleAr: true,
            slug: true,
            section: {
                select: {
                    unit: { select: { id: true, courseId: true, title: true, titleAr: true } },
                },
            },
        },
    },
};
export async function listMyStudyPlans(studentId) {
    return prisma.studyPlan.findMany({
        where: { studentId, isArchived: false },
        orderBy: { updatedAt: 'desc' },
        include: {
            items: {
                orderBy: [{ scheduledAt: 'asc' }, { order: 'asc' }],
                include: linkedContentInclude,
            },
        },
    });
}
export async function createStudyPlan(studentId, data) {
    return prisma.studyPlan.create({
        data: {
            studentId,
            title: data.title?.trim() || 'My Study Plan',
            goal: data.goal?.trim() || null,
            targetDate: data.targetDate || null,
        },
    });
}
export async function updateStudyPlan(studentId, planId, data) {
    await assertPlanOwner(studentId, planId);
    return prisma.studyPlan.update({
        where: { id: planId },
        data: {
            ...data,
            title: data.title?.trim(),
            goal: data.goal?.trim(),
        },
    });
}
export async function deleteStudyPlan(studentId, planId) {
    await assertPlanOwner(studentId, planId);
    await prisma.studyPlan.delete({ where: { id: planId } });
    return { id: planId, deleted: true };
}
export async function createStudyPlanItem(studentId, planId, data) {
    await assertPlanOwner(studentId, planId);
    await assertLinkedContentAccess(studentId, data);
    return prisma.studyPlanItem.create({
        data: {
            planId,
            title: data.title?.trim() || 'Study task',
            notes: data.notes?.trim() || null,
            scheduledAt: data.scheduledAt || null,
            status: data.status || 'TODO',
            priority: data.priority || 0,
            order: data.order || 0,
            courseId: data.courseId || null,
            unitId: data.unitId || null,
            lessonId: data.lessonId || null,
            completedAt: data.status === 'DONE' ? new Date() : null,
        },
        include: linkedContentInclude,
    });
}
export async function updateStudyPlanItem(studentId, planId, itemId, data) {
    await assertPlanOwner(studentId, planId);
    const existing = await prisma.studyPlanItem.findFirst({ where: { id: itemId, planId } });
    if (!existing)
        throw new AppError('Study plan item not found.', 404);
    await assertLinkedContentAccess(studentId, data);
    return prisma.studyPlanItem.update({
        where: { id: itemId },
        data: {
            ...data,
            title: data.title?.trim(),
            notes: data.notes?.trim(),
            completedAt: data.status === 'DONE' && existing.status !== 'DONE'
                ? new Date()
                : data.status && data.status !== 'DONE'
                    ? null
                    : existing.completedAt,
        },
        include: linkedContentInclude,
    });
}
export async function deleteStudyPlanItem(studentId, planId, itemId) {
    await assertPlanOwner(studentId, planId);
    const existing = await prisma.studyPlanItem.findFirst({ where: { id: itemId, planId } });
    if (!existing)
        throw new AppError('Study plan item not found.', 404);
    await prisma.studyPlanItem.delete({ where: { id: itemId } });
    return { id: itemId, deleted: true };
}
async function assertPlanOwner(studentId, planId) {
    const plan = await prisma.studyPlan.findFirst({ where: { id: planId, studentId } });
    if (!plan)
        throw new AppError('Study plan not found.', 404);
}
async function assertLinkedContentAccess(studentId, data) {
    const courseId = await resolveLinkedCourseId(data);
    if (!courseId)
        return;
    const allowed = await hasCourseAccess(studentId, courseId);
    if (!allowed)
        throw new AppError('You cannot link study tasks to a course you do not currently access.', 403);
}
async function resolveLinkedCourseId(data) {
    if (data.courseId)
        return data.courseId;
    if (data.unitId) {
        const unit = await prisma.unit.findUnique({ where: { id: data.unitId }, select: { courseId: true } });
        return unit?.courseId || null;
    }
    if (data.lessonId) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: data.lessonId },
            select: { section: { select: { unit: { select: { courseId: true } } } } },
        });
        return lesson?.section.unit.courseId || null;
    }
    return null;
}
//# sourceMappingURL=student-study-plan.service.js.map