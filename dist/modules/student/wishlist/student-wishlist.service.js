import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export const getMyWishlist = async (studentId) => {
    return prisma.wishlist.findMany({
        where: { studentId },
        include: {
            course: {
                include: {
                    instructor: { select: { fullName: true, avatar: true } },
                    category: { select: { name: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
export const addToWishlist = async (studentId, courseId) => {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course)
        throw new AppError('Course not found', 404);
    const existing = await prisma.wishlist.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing)
        return existing;
    return prisma.wishlist.create({
        data: { studentId, courseId },
    });
};
export const removeFromWishlist = async (studentId, courseId) => {
    const existing = await prisma.wishlist.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
    });
    if (!existing)
        throw new AppError('Item not found in wishlist', 404);
    await prisma.wishlist.delete({
        where: { studentId_courseId: { studentId, courseId } },
    });
    return null;
};
//# sourceMappingURL=student-wishlist.service.js.map