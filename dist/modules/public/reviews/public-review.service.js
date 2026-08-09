import { prisma } from '../../../prisma.js';
export const getCourseReviews = async (courseId, page, limit) => {
    const skip = (page - 1) * limit;
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
            take: limit,
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
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
//# sourceMappingURL=public-review.service.js.map