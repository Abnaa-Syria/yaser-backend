import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as reviewService from './public-review.service.js';

export const getCourseReviews = catchAsync(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const { page, limit } = req.query as any;

  const data = await reviewService.getCourseReviews(courseId, page, limit);

  return successResponse({
    res,
    data,
    message: 'Course reviews retrieved',
  });
});
