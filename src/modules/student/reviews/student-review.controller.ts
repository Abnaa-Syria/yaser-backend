import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as reviewService from './student-review.service.js';

export const createReview = catchAsync(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const studentId = req.user.id;

  const data = await reviewService.createReview(studentId, courseId, req.body);

  return successResponse({
    res,
    data,
    statusCode: 201,
    message: 'Review submitted successfully',
  });
});

export const updateReview = catchAsync(async (req: Request, res: Response) => {
  const reviewId = String(req.params.reviewId);
  const studentId = req.user.id;

  const data = await reviewService.updateReview(studentId, reviewId, req.body);

  return successResponse({
    res,
    data,
    message: 'Review updated successfully',
  });
});
