import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { userHasRoleName } from '../../../utils/role-query.js';
import { notDeleted, softDeleteData } from '../../../utils/soft-delete.js';
import { logAudit } from '../../../services/audit-logger.service.js';
import { ContentStatus } from '@prisma/client';
/**
 * Create a new course
 */
export const createCourse = async (data, actorId) => {
    const course = await prisma.course.create({
        data: {
            title: data.title,
            description: data.description,
            thumbnail: data.thumbnail,
            introVideoUrl: data.introVideoUrl,
            categoryId: data.categoryId || undefined,
            instructorId: data.instructorId || undefined,
            price: data.price ?? 0,
            isLifetimePurchasable: data.isLifetimePurchasable ?? true,
            type: data.type ?? 'RECORDED',
            isActive: data.isActive !== undefined ? data.isActive : false,
            status: ContentStatus.DRAFT,
            targetLevels: data.targetLevels ? data.targetLevels : null,
            pricingTiers: data.pricingTiers ? {
                create: data.pricingTiers.map((tier) => ({
                    name: tier.name,
                    nameAr: tier.nameAr,
                    price: tier.price,
                    durationDays: tier.durationDays || null,
                    isActive: tier.isActive !== undefined ? tier.isActive : true,
                })),
            } : undefined,
        },
        select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
        },
    });
    if (actorId) {
        await logAudit({
            userId: actorId,
            action: 'COURSE_CREATED',
            entityType: 'COURSE',
            entityId: course.id,
            details: { title: course.title },
        });
    }
    return course;
};
/**
 * Update existing course
 */
export const updateCourse = async (id, data, actorId) => {
    return prisma.$transaction(async (tx) => {
        const course = await tx.course.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                thumbnail: data.thumbnail,
                introVideoUrl: data.introVideoUrl,
                categoryId: data.categoryId,
                isActive: data.isActive,
                price: data.price,
                isLifetimePurchasable: data.isLifetimePurchasable,
                type: data.type,
                instructorId: data.instructorId,
                targetLevels: data.targetLevels !== undefined ? data.targetLevels : undefined,
            },
            select: {
                id: true,
                title: true,
                isActive: true,
                status: true,
            },
        });
        if (data.pricingTiers !== undefined) {
            const incomingTiers = data.pricingTiers || [];
            const existingTiers = await tx.coursePricingTier.findMany({
                where: { courseId: id },
            });
            const incomingIds = incomingTiers.map((t) => t.id).filter(Boolean);
            const tiersToDelete = existingTiers.filter((t) => !incomingIds.includes(t.id));
            if (tiersToDelete.length > 0) {
                await tx.coursePricingTier.deleteMany({
                    where: { id: { in: tiersToDelete.map((t) => t.id) } },
                });
            }
            for (const tier of incomingTiers) {
                if (tier.id) {
                    await tx.coursePricingTier.update({
                        where: { id: tier.id },
                        data: {
                            name: tier.name,
                            nameAr: tier.nameAr,
                            price: tier.price,
                            durationDays: tier.durationDays !== undefined ? tier.durationDays : null,
                            isActive: tier.isActive !== undefined ? tier.isActive : true,
                        },
                    });
                }
                else {
                    await tx.coursePricingTier.create({
                        data: {
                            courseId: id,
                            name: tier.name,
                            nameAr: tier.nameAr,
                            price: tier.price,
                            durationDays: tier.durationDays !== undefined ? tier.durationDays : null,
                            isActive: tier.isActive !== undefined ? tier.isActive : true,
                        },
                    });
                }
            }
        }
        if (actorId) {
            await logAudit({
                userId: actorId,
                action: 'COURSE_UPDATED',
                entityType: 'COURSE',
                entityId: id,
                details: data,
            });
        }
        return course;
    });
};
/**
 * Delete course
 */
export const deleteCourse = async (id, actorId) => {
    await prisma.course.update({ where: { id }, data: softDeleteData() });
    if (actorId) {
        await logAudit({
            userId: actorId,
            action: 'COURSE_SOFT_DELETED',
            entityType: 'COURSE',
            entityId: id,
        });
    }
    return { id, deleted: true };
};
/**
 * Assign an instructor to a course
 */
export const assignInstructor = async (courseId, instructorId) => {
    // Check if instructor exists and has correct role
    const instructor = await prisma.user.findFirst({
        where: { id: instructorId, ...userHasRoleName('INSTRUCTOR') },
    });
    if (!instructor)
        throw new AppError('Target user is not a valid instructor.', 400);
    const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { instructorId },
        select: {
            id: true,
            title: true,
            instructor: {
                select: { fullName: true },
            },
        },
    });
    return updatedCourse;
};
/**
 * Get all courses with filtering and pagination
 */
export const getAllCourses = async (options) => {
    const { page, limit, categoryId, instructorId, status, search } = options;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const where = notDeleted();
    if (categoryId)
        where.categoryId = categoryId;
    if (instructorId)
        where.instructorId = instructorId;
    if (status) {
        if (status === 'active')
            where.isActive = true;
        else if (['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
            where.status = status;
        }
    }
    if (search) {
        where.title = { contains: search };
    }
    const [courses, total] = await Promise.all([
        prisma.course.findMany({
            where,
            skip: skip,
            take: limitNum,
            include: {
                category: { select: { id: true, name: true } },
                instructor: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.course.count({ where })
    ]);
    return {
        courses,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
/**
 * Get detailed course info
 */
export const getCourseById = async (id) => {
    const course = await prisma.course.findFirst({
        where: notDeleted({ id }),
        include: {
            category: true,
            pricingTiers: true,
            instructor: {
                select: { id: true, fullName: true, email: true, avatar: true },
            },
            liveSessions: {
                orderBy: { startTime: 'asc' },
                include: {
                    instructor: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            },
            units: {
                orderBy: { order: 'asc' },
                include: {
                    sections: {
                        where: notDeleted(),
                        orderBy: { order: 'asc' },
                        include: {
                            lessons: {
                                where: notDeleted(),
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                },
            },
            homeworks: {
                include: {
                    lessons: {
                        include: {
                            lesson: { select: { id: true, title: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            },
            exams: {
                include: {
                    questions: { orderBy: { order: 'asc' } },
                },
                orderBy: { createdAt: 'desc' },
            },
        }
    });
    if (!course)
        throw new AppError('Course not found', 404);
    return course;
};
export const submitCourseForReview = async (courseId, actorId) => {
    const course = await prisma.course.update({
        where: { id: courseId },
        data: { status: ContentStatus.PENDING_REVIEW },
        select: { id: true, title: true, status: true },
    });
    await logAudit({
        userId: actorId,
        action: 'COURSE_SUBMITTED_FOR_REVIEW',
        entityType: 'COURSE',
        entityId: courseId,
    });
    return course;
};
export const approveCourse = async (courseId, reviewerId, reviewNotes) => {
    const course = await prisma.course.update({
        where: { id: courseId },
        data: {
            status: ContentStatus.APPROVED,
            isActive: true,
            reviewedById: reviewerId,
            reviewNotes: reviewNotes ?? null,
            rejectionReason: null,
        },
        select: { id: true, title: true, status: true },
    });
    await logAudit({
        userId: reviewerId,
        action: 'COURSE_APPROVED',
        entityType: 'COURSE',
        entityId: courseId,
        details: { reviewNotes },
    });
    return course;
};
export const rejectCourse = async (courseId, reviewerId, rejectionReason, reviewNotes) => {
    const course = await prisma.course.update({
        where: { id: courseId },
        data: {
            status: ContentStatus.REJECTED,
            isActive: false,
            reviewedById: reviewerId,
            rejectionReason,
            reviewNotes: reviewNotes ?? null,
        },
        select: { id: true, title: true, status: true, rejectionReason: true },
    });
    await logAudit({
        userId: reviewerId,
        action: 'COURSE_REJECTED',
        entityType: 'COURSE',
        entityId: courseId,
        details: { rejectionReason, reviewNotes },
    });
    return course;
};
export const getReviewQueue = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const where = notDeleted({ status: ContentStatus.PENDING_REVIEW });
    const [courses, total] = await Promise.all([
        prisma.course.findMany({
            where,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                instructor: { select: { id: true, fullName: true } },
            },
        }),
        prisma.course.count({ where }),
    ]);
    return { courses, total, page, limit };
};
export const listCourseStaff = async (courseId) => {
    return prisma.courseStaff.findMany({
        where: { courseId },
        include: {
            user: { select: { id: true, fullName: true, email: true, avatar: true } },
        },
    });
};
export const addCourseStaff = async (courseId, userId, role, actorId) => {
    const staff = await prisma.courseStaff.create({
        data: { courseId, userId, role },
        include: {
            user: { select: { id: true, fullName: true, email: true } },
        },
    });
    await logAudit({
        userId: actorId,
        action: 'COURSE_STAFF_ASSIGNED',
        entityType: 'COURSE',
        entityId: courseId,
        details: { userId, role },
    });
    return staff;
};
export const removeCourseStaff = async (courseId, staffId, actorId) => {
    await prisma.courseStaff.delete({ where: { id: staffId, courseId } });
    await logAudit({
        userId: actorId,
        action: 'COURSE_STAFF_REMOVED',
        entityType: 'COURSE',
        entityId: courseId,
        details: { staffId },
    });
    return { id: staffId, removed: true };
};
//# sourceMappingURL=admin-course.service.js.map