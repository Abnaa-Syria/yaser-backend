import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as instructorDashboardService from './instructor-dashboard.service.js';

export const getOverview = catchAsync(async (req: Request, res: Response) => {
  const data = await instructorDashboardService.getInstructorOverview(req.user.id);
  return successResponse({
    res,
    data,
    message: 'Instructor dashboard overview retrieved successfully',
  });
});
