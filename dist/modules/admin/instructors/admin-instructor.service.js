import { prisma } from '../../../prisma.js';
import { hashPassword } from '../../../utils/security/hash.js';
import { AppError } from '../../../utils/AppError.js';
import { getRoleIdByName, userHasRoleName } from '../../../utils/role-query.js';
import { getInstructorPerformanceDashboard } from '../../instructor/performance/instructor-performance.service.js';
import { platformFeatures } from '../../../config/features.config.js';
import { courseOwnerRoleFilter } from '../../../config/platform-instructor.js';
import { addAvailability, deleteAvailabilitySlot, updateAvailabilitySlotPrice, } from '../../instructor/availability/instructor-availability.service.js';
/**
 * Create a new instructor (Admin only) — multi-instructor platforms only.
 */
export const createInstructor = async (data) => {
    if (!platformFeatures.multiInstructor) {
        throw new AppError('This platform has a single instructor (the platform owner). Adding instructors is disabled.', 403);
    }
    const hashedPassword = await hashPassword(data.password);
    const instructorRoleId = await getRoleIdByName('INSTRUCTOR');
    const instructor = await prisma.user.create({
        data: {
            email: data.email.trim().toLowerCase(),
            password: hashedPassword,
            fullName: data.fullName.trim(),
            phone: data.phone?.trim(),
            bio: data.bio,
            experience: data.experience,
            roleId: instructorRoleId,
            isActive: true,
        },
    });
    const { password, ...instructorWithoutSensitive } = instructor;
    return instructorWithoutSensitive;
};
/**
 * Get all instructors with filtering and pagination
 */
export const getAllInstructors = async (query) => {
    const { isActive, search, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = courseOwnerRoleFilter();
    if (isActive !== undefined)
        where.isActive = isActive === 'true';
    if (search) {
        where.OR = [
            { fullName: { contains: search } },
            { email: { contains: search } },
        ];
    }
    // In single-owner mode, only show people who actually teach (or the platform owner).
    if (!platformFeatures.multiInstructor) {
        where.AND = [
            ...(where.AND || []),
            {
                OR: [
                    { coursesInstructed: { some: {} } },
                    userHasRoleName('SUPER_ADMIN'),
                ],
            },
        ];
    }
    const [rows, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isActive: true,
                averageRating: true,
                createdAt: true,
                experience: true,
                coursesInstructed: {
                    select: {
                        id: true,
                        title: true,
                        _count: { select: { purchases: true } },
                    },
                },
                wallet: {
                    select: { totalEarned: true },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);
    const instructors = rows.map((inst) => {
        const courseTitles = inst.coursesInstructed.map((c) => c.title);
        const coursesCount = courseTitles.length;
        const totalStudents = inst.coursesInstructed.reduce((acc, c) => acc + c._count.purchases, 0);
        const revenue = Math.round(Number(inst.wallet?.totalEarned ?? 0) * 100) / 100;
        const rating = inst.averageRating != null ? Math.round(Number(inst.averageRating) * 100) / 100 : null;
        const coursesSummary = coursesCount === 0
            ? null
            : coursesCount <= 2
                ? courseTitles.join(', ')
                : `${courseTitles.slice(0, 2).join(', ')} +${coursesCount - 2}`;
        return {
            id: inst.id,
            fullName: inst.fullName,
            email: inst.email,
            phone: inst.phone,
            isActive: inst.isActive,
            averageRating: inst.averageRating,
            createdAt: inst.createdAt,
            experience: inst.experience,
            coursesCount,
            coursesSummary,
            totalStudents,
            rating,
            revenue,
        };
    });
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
/**
 * Get full instructor details (Admin view)
 */
export const getInstructorById = async (id) => {
    const instructor = await prisma.user.findFirst({
        where: { id, ...courseOwnerRoleFilter() },
        include: {
            coursesInstructed: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    isActive: true,
                    _count: { select: { purchases: true } },
                },
            },
            receivedReviews: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { select: { fullName: true } }
                }
            },
            wallet: {
                include: {
                    transactions: {
                        take: 20,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            },
            payoutRequests: {
                orderBy: { createdAt: 'desc' },
                take: 20,
            },
        },
    });
    if (!instructor)
        throw new AppError('Instructor not found.', 404);
    const { password, ...instructorWithoutSensitive } = instructor;
    // Aggregate stats
    const stats = {
        totalCourses: instructor.coursesInstructed.length,
        totalStudents: instructor.coursesInstructed.reduce((acc, course) => acc + course._count.purchases, 0),
        averageRating: instructor.averageRating,
    };
    return { ...instructorWithoutSensitive, stats };
};
/**
 * Operational performance metrics for an instructor (admin read-only).
 */
export const getInstructorPerformanceForAdmin = async (instructorId) => {
    const exists = await prisma.user.findFirst({
        where: { id: instructorId, ...courseOwnerRoleFilter() },
        select: { id: true },
    });
    if (!exists)
        throw new AppError('Instructor not found.', 404);
    return getInstructorPerformanceDashboard(instructorId);
};
/**
 * Upcoming availability slots for an instructor (admin).
 */
export const getInstructorAvailabilityForAdmin = async (instructorId) => {
    const exists = await prisma.user.findFirst({
        where: { id: instructorId, ...courseOwnerRoleFilter() },
        select: { id: true },
    });
    if (!exists)
        throw new AppError('Instructor not found.', 404);
    const now = new Date();
    return prisma.instructorAvailability.findMany({
        where: {
            instructorId,
            startTime: { gte: now },
            status: 'AVAILABLE',
        },
        orderBy: { startTime: 'asc' },
        select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            price: true,
            createdAt: true,
        },
    });
};
export const createInstructorAvailabilityForAdmin = async (instructorId, data) => {
    const exists = await prisma.user.findFirst({
        where: { id: instructorId, ...courseOwnerRoleFilter() },
        select: { id: true },
    });
    if (!exists)
        throw new AppError('Instructor not found.', 404);
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
        throw new AppError('Invalid start time.', 400);
    }
    if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime()) || endTime <= startTime) {
        throw new AppError('End time must be after start time.', 400);
    }
    return addAvailability(instructorId, startTime, endTime, Number(data.price));
};
export const deleteInstructorAvailabilityForAdmin = async (instructorId, slotId) => {
    return deleteAvailabilitySlot(instructorId, slotId);
};
export const updateInstructorAvailabilityPriceForAdmin = async (instructorId, slotId, price) => {
    return updateAvailabilitySlotPrice(instructorId, slotId, price);
};
/**
 * Update instructor (Admin only)
 */
export const updateInstructor = async (id, data) => {
    const instructor = await prisma.user.findFirst({ where: { id, ...courseOwnerRoleFilter() } });
    if (!instructor)
        throw new AppError('Instructor not found.', 404);
    const updatedInstructor = await prisma.user.update({
        where: { id },
        data,
    });
    const { password, ...instructorWithoutSensitive } = updatedInstructor;
    return instructorWithoutSensitive;
};
/**
 * Delete instructor (Admin only)
 */
export const deleteInstructor = async (id) => {
    const instructor = await prisma.user.findFirst({ where: { id, ...courseOwnerRoleFilter() } });
    if (!instructor)
        throw new AppError('Instructor not found.', 404);
    await prisma.user.delete({ where: { id } });
    return { id, deleted: true };
};
//# sourceMappingURL=admin-instructor.service.js.map