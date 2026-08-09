import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as reviewService from './admin-review.service.js';
import { generateEvaluationReportPDF } from '../../../utils/pdfGenerator.js';

export const toggleVisibility = catchAsync(async (req: Request, res: Response) => {
  const reviewId = String(req.params.reviewId);
  const { isVisible } = req.body;

  const data = await reviewService.toggleVisibility(reviewId, isVisible);

  return successResponse({
    res,
    data,
    message: `Review is now ${isVisible ? 'visible' : 'hidden'}`,
  });
});

export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const reviewId = String(req.params.reviewId);
  await reviewService.deleteReview(reviewId);

  return successResponse({
    res,
    message: 'Review deleted successfully',
  });
});

export const getReviews = catchAsync(async (req: Request, res: Response) => {
  const data = await reviewService.getAllReviews(req.query);
  return successResponse({ res, data, results: (data as any).reviews.length });
});

export const getReview = catchAsync(async (req: Request, res: Response) => {
  const data = await reviewService.getReviewById(req.params.reviewId as string);
  return successResponse({ res, data });
});

export const exportReviewsPdf = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.query;

  const stats = await reviewService.getCourseReviewStats(String(courseId));

  const reportData = {
    title: stats.title,
    subtitle: 'تقرير تقييم الكورس والمراجعات الطلابية',
    overallRating: stats.overallRating,
    totalResponses: stats.totalResponses,
    distribution: stats.distribution,
    questionBreakdown: stats.questionBreakdown,
  };

  const pdfBuffer = await generateEvaluationReportPDF(reportData);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=course-reviews-report.pdf');
  return res.send(pdfBuffer);
});

