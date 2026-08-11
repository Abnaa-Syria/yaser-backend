import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { notDeleted, softDeleteData } from '../../../utils/soft-delete.js';
import { logAudit } from '../../../services/audit-logger.service.js';
import { ContentStatus } from '@prisma/client';
/**
 * Enforce that the instructor owns the course
 */
export const assertInstructorOwnsCourse = async (courseId, instructorId) => {
    const course = await prisma.course.findFirst({
        where: notDeleted({ id: courseId, instructorId }),
        select: { id: true },
    });
    if (!course) {
        throw new AppError('Course not found or you do not have access.', 404);
    }
    return course;
};
/**
 * Get courses assigned to the instructor with pagination and filtering
 */
export const getInstructorCourses = async (instructorId, options) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;
    const { categoryId, status, search } = options;
    const where = notDeleted({ instructorId });
    if (categoryId)
        where.categoryId = categoryId;
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
            skip,
            take: limit,
            include: {
                category: { select: { id: true, name: true } },
                _count: { select: { purchases: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count({ where }),
    ]);
    const mappedCourses = courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description || '',
        thumbnail: c.thumbnail,
        introVideoUrl: c.introVideoUrl,
        type: c.type,
        price: c.price,
        isActive: c.isActive,
        status: c.status,
        category: c.category,
        enrollmentCount: c._count.purchases,
        rejectionReason: c.rejectionReason,
    }));
    return {
        courses: mappedCourses,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
/**
 * Get full details of a course by ID for the instructor
 */
export const getInstructorCourseById = async (courseId, instructorId) => {
    const course = await prisma.course.findFirst({
        where: notDeleted({ id: courseId, instructorId }),
        include: {
            category: true,
            instructor: {
                select: { id: true, fullName: true, email: true, avatar: true },
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
            exams: {
                include: {
                    questions: { orderBy: { order: 'asc' } },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    if (!course)
        throw new AppError('Course not found or access denied.', 404);
    return course;
};
/**
 * Create a new course for the instructor (always starts as DRAFT/inactive)
 */
export const createInstructorCourse = async (instructorId, data) => {
    const course = await prisma.course.create({
        data: {
            title: data.title,
            description: data.description ?? null,
            thumbnail: data.thumbnail ?? null,
            introVideoUrl: data.introVideoUrl ?? null,
            categoryId: data.categoryId || undefined,
            instructorId,
            price: data.price ?? 0,
            isLifetimePurchasable: data.isLifetimePurchasable ?? true,
            type: data.type ?? 'RECORDED',
            isActive: false,
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
    await logAudit({
        userId: instructorId,
        action: 'INSTRUCTOR_COURSE_CREATED',
        entityType: 'COURSE',
        entityId: course.id,
        details: { title: course.title },
    });
    return course;
};
/**
 * Update an instructor's course
 */
export const updateInstructorCourse = async (courseId, instructorId, data) => {
    await assertInstructorOwnsCourse(courseId, instructorId);
    return prisma.$transaction(async (tx) => {
        const course = await tx.course.update({
            where: { id: courseId },
            data: {
                title: data.title,
                description: data.description,
                thumbnail: data.thumbnail,
                introVideoUrl: data.introVideoUrl,
                categoryId: data.categoryId,
                price: data.price,
                isLifetimePurchasable: data.isLifetimePurchasable,
                type: data.type,
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
                where: { courseId },
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
                            courseId,
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
        await logAudit({
            userId: instructorId,
            action: 'INSTRUCTOR_COURSE_UPDATED',
            entityType: 'COURSE',
            entityId: courseId,
            details: data,
        });
        return course;
    });
};
/**
 * Soft delete an instructor's course
 */
export const deleteInstructorCourse = async (courseId, instructorId) => {
    await assertInstructorOwnsCourse(courseId, instructorId);
    await prisma.course.update({
        where: { id: courseId },
        data: softDeleteData(),
    });
    await logAudit({
        userId: instructorId,
        action: 'INSTRUCTOR_COURSE_SOFT_DELETED',
        entityType: 'COURSE',
        entityId: courseId,
    });
    return { id: courseId, deleted: true };
};
/**
 * Submit an instructor's course for editorial review
 */
export const submitCourseForReview = async (courseId, instructorId) => {
    await assertInstructorOwnsCourse(courseId, instructorId);
    const course = await prisma.course.update({
        where: { id: courseId },
        data: { status: ContentStatus.PENDING_REVIEW },
        select: { id: true, title: true, status: true },
    });
    await logAudit({
        userId: instructorId,
        action: 'INSTRUCTOR_COURSE_SUBMITTED_FOR_REVIEW',
        entityType: 'COURSE',
        entityId: courseId,
    });
    return course;
};
//# sourceMappingURL=instructor-course.service.js.map