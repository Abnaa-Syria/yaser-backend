import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { getPlatformInstructorId } from '../../../config/platform-instructor.js';
import { logAudit } from '../../../services/audit-logger.service.js';
async function resolveInstructorId(instructorId) {
    if (instructorId)
        return instructorId;
    const platformId = await getPlatformInstructorId();
    if (!platformId)
        throw new AppError('Platform instructor is not configured.', 400);
    return platformId;
}
async function refreshAverageRating(instructorId) {
    const agg = await prisma.instructorReview.aggregate({
        where: { instructorId, isVisible: true },
        _avg: { rating: true },
    });
    await prisma.user.update({
        where: { id: instructorId },
        data: { averageRating: agg._avg.rating ?? 0 },
    });
}
export const listInstructorReviews = async (query) => {
    const instructorId = await resolveInstructorId(query.instructorId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;
    const where = { instructorId };
    if (!query.includeHidden)
        where.isVisible = true;
    const [reviews, total] = await prisma.$transaction([
        prisma.instructorReview.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                student: { select: { id: true, fullName: true, avatar: true } },
            },
        }),
        prisma.instructorReview.count({ where }),
    ]);
    return {
        instructorId,
        reviews,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
};
export const createInstructorReview = async (data, actorId) => {
    const instructorId = await resolveInstructorId(data.instructorId);
    const displayName = String(data.displayName || '').trim();
    if (!displayName)
        throw new AppError('Display name is required.', 400);
    const rating = Math.min(5, Math.max(1, Number(data.rating) || 5));
    if (data.studentId) {
        const existing = await prisma.instructorReview.findUnique({
            where: {
                instructorId_studentId: { instructorId, studentId: data.studentId },
            },
        });
        if (existing)
            throw new AppError('This student already reviewed this doctor.', 409);
    }
    const review = await prisma.instructorReview.create({
        data: {
            instructorId,
            studentId: data.studentId || null,
            displayName,
            rating,
            comment: data.comment?.trim() || null,
            isVisible: data.isVisible !== false,
            isFeaturedOnHome: Boolean(data.isFeaturedOnHome),
        },
        include: {
            student: { select: { id: true, fullName: true, avatar: true } },
        },
    });
    await refreshAverageRating(instructorId);
    if (actorId) {
        await logAudit({
            userId: actorId,
            action: 'INSTRUCTOR_REVIEW_CREATED',
            entityType: 'INSTRUCTOR_REVIEW',
            entityId: review.id,
        });
    }
    return review;
};
export const updateInstructorReview = async (reviewId, data, actorId) => {
    const existing = await prisma.instructorReview.findUnique({ where: { id: reviewId } });
    if (!existing)
        throw new AppError('Review not found.', 404);
    const review = await prisma.instructorReview.update({
        where: { id: reviewId },
        data: {
            ...(data.displayName !== undefined ? { displayName: String(data.displayName).trim() || existing.displayName } : {}),
            ...(data.rating !== undefined ? { rating: Math.min(5, Math.max(1, Number(data.rating) || 5)) } : {}),
            ...(data.comment !== undefined ? { comment: data.comment?.trim() || null } : {}),
            ...(data.isVisible !== undefined ? { isVisible: Boolean(data.isVisible) } : {}),
            ...(data.isFeaturedOnHome !== undefined ? { isFeaturedOnHome: Boolean(data.isFeaturedOnHome) } : {}),
        },
        include: {
            student: { select: { id: true, fullName: true, avatar: true } },
        },
    });
    await refreshAverageRating(existing.instructorId);
    if (actorId) {
        await logAudit({
            userId: actorId,
            action: 'INSTRUCTOR_REVIEW_UPDATED',
            entityType: 'INSTRUCTOR_REVIEW',
            entityId: reviewId,
        });
    }
    return review;
};
export const deleteInstructorReview = async (reviewId, actorId) => {
    const existing = await prisma.instructorReview.findUnique({ where: { id: reviewId } });
    if (!existing)
        throw new AppError('Review not found.', 404);
    await prisma.instructorReview.delete({ where: { id: reviewId } });
    await refreshAverageRating(existing.instructorId);
    if (actorId) {
        await logAudit({
            userId: actorId,
            action: 'INSTRUCTOR_REVIEW_DELETED',
            entityType: 'INSTRUCTOR_REVIEW',
            entityId: reviewId,
        });
    }
    return { id: reviewId };
};
//# sourceMappingURL=admin-instructor-review.service.js.map