import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as reviewService from './public-review.service.js';

export const getCourseReviews = catchAsync(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const q = req.query as { page?: number | string; limit?: number | string };
  const page = typeof q.page === 'number' ? q.page : Number(q.page) || 1;
  const limit = typeof q.limit === 'number' ? q.limit : Number(q.limit) || 10;

  const data = await reviewService.getCourseReviews(courseId, page, limit);

  return successResponse({
    res,
    data,
    message: 'Course reviews retrieved',
  });
});
