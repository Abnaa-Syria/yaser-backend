import { Request, Response } from 'express';
import * as instructorStudentService from './instructor-student.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const listStudents = catchAsync(async (req: Request, res: Response) => {
  const { courseId, search, page, limit } = req.query;
  const result = await instructorStudentService.listInstructorStudents(req.user.id, {
    courseId: courseId as string | undefined,
    search: search as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  successResponse({
    res,
    data: result.students,
    message: 'Students retrieved successfully',
    meta: result.pagination,
  });
});

export const getStudentPerformance = catchAsync(async (req: Request, res: Response) => {
  const result = await instructorStudentService.getStudentPerformanceForInstructor(
    req.user.id,
    req.params.id as string
  );
  successResponse({ res, data: result, message: 'Student performance retrieved' });
});
