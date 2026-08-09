import { Request, Response } from 'express';
import * as adminStudentService from './admin-student.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const getStudentPerformance = catchAsync(async (req: Request, res: Response) => {
  const result = await adminStudentService.getStudentPerformanceForAdmin(req.params.id as string);
  successResponse({ res, data: result, message: 'Student performance retrieved' });
});
