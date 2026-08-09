import { Request, Response } from 'express';
import * as instructorService from './public-instructor.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const getInstructors = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorService.getPublicInstructors(req.query);
  successResponse({ res, data: result.instructors, message: 'Instructors retrieved successfully', meta: result.pagination });
});

export const getInstructorSlots = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
  const result = await instructorService.getInstructorAvailableSlots(req.params.id as string, limit);
  successResponse({ res, data: result, message: 'Available slots retrieved' });
});

export const getInstructor = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorService.getPublicInstructorProfile(req.params.id as string);
  successResponse({ res, data: result, message: 'Instructor profile retrieved' });
});

export const getPlatformOwner = catchAsync(async (_req: Request, res: Response) => {
  const result = await instructorService.getPlatformOwnerPublicProfile();
  successResponse({ res, data: result, message: 'Platform instructor retrieved' });
});

export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorService.getInstructorCourses(req.params.id as string);
  successResponse({ res, data: result, message: 'Instructor courses retrieved' });
});

export const getReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorService.getInstructorReviews(req.params.id as string);
  successResponse({ res, data: result, message: 'Instructor reviews retrieved' });
});
