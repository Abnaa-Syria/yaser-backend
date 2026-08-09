import { Request, Response } from 'express';
import * as instructorCourseService from './instructor-course.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const getMyCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorCourseService.getInstructorCourses(req.user.id, req.query);
  successResponse({
    res,
    data: result.courses,
    results: result.courses.length,
    message: 'Courses retrieved successfully',
    meta: result.pagination,
  });
});

export const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorCourseService.getInstructorCourseById(req.params.id as string, req.user.id);
  successResponse({
    res,
    data: result,
    message: 'Course details fetched successfully',
  });
});

export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorCourseService.createInstructorCourse(req.user.id, req.body);
  successResponse({
    res,
    data: result,
    message: 'Course created successfully',
    statusCode: 201,
  });
});

export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorCourseService.updateInstructorCourse(req.params.id as string, req.user.id, req.body);
  successResponse({
    res,
    data: result,
    message: 'Course updated successfully',
  });
});

export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorCourseService.deleteInstructorCourse(req.params.id as string, req.user.id);
  successResponse({
    res,
    data: result,
    message: 'Course deleted successfully',
  });
});

export const submitForReview = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorCourseService.submitCourseForReview(req.params.id as string, req.user.id);
  successResponse({
    res,
    data: result,
    message: 'Course submitted for review successfully',
  });
});
