import { Request, Response } from 'express';
import * as studentCourseService from './student-course.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const getMyCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await studentCourseService.getMyCourses(req.user.id);
  successResponse({ res, data: result, message: 'Enrolled courses retrieved successfully' });
});

export const getRecommendedCourses = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await studentCourseService.getRecommendedCourses(req.user.id, { limit });
  successResponse({ res, data: result, message: 'Recommended courses retrieved successfully' });
});

export const getCourseContent = catchAsync(async (req: Request, res: Response) => {
  const result = await studentCourseService.getCourseContent(req.user.id, req.params.id as string);
  successResponse({ res, data: result, message: 'Course content retrieved' });
});

export const getCourseExams = catchAsync(async (req: Request, res: Response) => {
  const result = await studentCourseService.getCourseExams(req.user.id, req.params.id as string);
  successResponse({ res, data: result, message: 'Course exams retrieved' });
});
