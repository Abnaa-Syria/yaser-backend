import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';

export const createReview = async (studentId: string, courseId: string, data: { rating: number; comment: string }) => {
  await requireCourseAccess(studentId, courseId);

  const existingReview = await prisma.courseReview.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this course', 400);
  }

  return prisma.courseReview.create({
    data: {
      studentId,
      courseId,
      ...data,
    },
  });
};

export const updateReview = async (studentId: string, reviewId: string, data: { rating?: number; comment?: string }) => {
  const review = await prisma.courseReview.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.studentId !== studentId) {
    throw new AppError('You can only update your own reviews', 403);
  }

  return prisma.courseReview.update({
    where: { id: reviewId },
    data,
  });
};
