import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { userHasRoleName } from '../../../utils/role-query.js';
export const getAllInstructors = async (query) => {
    const { page = '1', limit = '10', search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = userHasRoleName('INSTRUCTOR');
    if (search) {
        where.OR = [{ fullName: { contains: search } }, { bio: { contains: search } }];
    }
    const [instructors, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { averageRating: 'desc' },
            select: {
                id: true,
                fullName: true,
                avatar: true,
                bio: true,
                experience: true,
                averageRating: true,
            },
        }),
        prisma.user.count({ where }),
    ]);
    return {
        instructors,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};
export const getPublicInstructors = getAllInstructors;
/**
 * Get instructor profile by ID
 */
export const getInstructorById = async (id) => {
    const instructor = await prisma.user.findFirst({
        where: { id, ...userHasRoleName('INSTRUCTOR'), isActive: true },
        select: {
            id: true,
            fullName: true,
            avatar: true,
            bio: true,
            experience: true,
            averageRating: true,
            receivedReviews: {
                where: { isVisible: true },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { select: { fullName: true, avatar: true } },
                },
            },
        },
    });
    if (!instructor)
        throw new AppError('Instructor not found.', 404);
    return instructor;
};
/** Alias for controller compatibility */
export const getPublicInstructorProfile = getInstructorById;
/**
 * Get courses taught by an instructor
 */
export const getInstructorCourses = async (id) => {
    return prisma.course.findMany({
        where: { isActive: true, instructorId: id },
        select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            type: true,
            price: true,
        },
    });
};
/**
 * Get reviews for an instructor
 */
export const getInstructorReviews = async (id) => {
    return prisma.instructorReview.findMany({
        where: { instructorId: id, isVisible: true },
        include: {
            student: { select: { fullName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};
/** Upcoming bookable slots for a specific instructor (public catalog). */
export const getInstructorAvailableSlots = async (id, limit = 24) => {
    const instructor = await prisma.user.findFirst({
        where: { id, ...userHasRoleName('INSTRUCTOR'), isActive: true },
        select: { id: true },
    });
    if (!instructor)
        throw new AppError('Instructor not found.', 404);
    const now = new Date();
    return prisma.instructorAvailability.findMany({
        where: {
            instructorId: id,
            status: 'AVAILABLE',
            startTime: { gte: now },
            price: { gt: 0 },
        },
        take: Math.min(Math.max(limit, 1), 50),
        orderBy: { startTime: 'asc' },
        select: {
            id: true,
            startTime: true,
            endTime: true,
            price: true,
        },
    });
};
//# sourceMappingURL=public-instructor.service.js.map