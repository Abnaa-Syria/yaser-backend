import { prisma } from '../../../prisma.js';
export const getCourseReviews = async (courseId, page, limit) => {
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 10));
    const skip = (safePage - 1) * safeLimit;
    const [reviews, total] = await Promise.all([
        prisma.courseReview.findMany({
            where: {
                courseId,
                isVisible: true,
            },
            include: {
                student: {
                    select: {
                        fullName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: safeLimit,
        }),
        prisma.courseReview.count({
            where: {
                courseId,
                isVisible: true,
            },
        }),
    ]);
    return {
        reviews,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit) || 0,
        },
    };
};
//# sourceMappingURL=public-review.service.js.map