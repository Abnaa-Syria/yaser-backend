import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

export const toggleVisibility = async (reviewId: string, isVisible: boolean) => {
  const review = await prisma.courseReview.findUnique({ where: { id: reviewId } });
  if (!review) throw new AppError('Review not found', 404);

  return await prisma.courseReview.update({
    where: { id: reviewId },
    data: { isVisible },
  });
};

export const deleteReview = async (reviewId: string) => {
  const review = await prisma.courseReview.findUnique({ where: { id: reviewId } });
  if (!review) throw new AppError('Review not found', 404);

  await prisma.courseReview.delete({ where: { id: reviewId } });
  return null;
};

export const getAllReviews = async (options: any) => {
  const { page = 1, limit = 10, courseId, rating } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (courseId) where.courseId = courseId;
  if (rating) where.rating = rating;

  const [reviews, total] = await Promise.all([
    prisma.courseReview.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { fullName: true, avatar: true } },
        course: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.courseReview.count({ where })
  ]);

  return { reviews, total, page, limit };
};

export const getReviewById = async (id: string) => {
  const review = await prisma.courseReview.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, fullName: true, avatar: true, email: true } },
      course: { select: { id: true, title: true } }
    }
  });
  if (!review) throw new AppError('Review not found', 404);
  return review;
};

export const getCourseReviewStats = async (courseId: string) => {
  const reviews = await prisma.courseReview.findMany({
    where: { courseId },
    select: { rating: true },
  });

  const totalResponses = reviews.length;
  const sumRatings = reviews.reduce((acc, r) => acc + r.rating, 0);
  const overallRating = totalResponses > 0 ? sumRatings / totalResponses : 0.0;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    }
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  return {
    title: course?.title || 'مساق دراسي',
    overallRating,
    totalResponses,
    distribution,
    questionBreakdown: [
      {
        question: 'التقييم العام للمحتوى والمادة التعليمية للمساق',
        avgRating: overallRating,
        responses: totalResponses,
      },
    ],
  };
};

