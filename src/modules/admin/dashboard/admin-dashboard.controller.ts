import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as dashboardService from './admin-dashboard.service.js';

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getStats();
  return successResponse({ 
    res, 
    data, 
    message: 'Admin dashboard statistics retrieved successfully' 
  });
});

export const getOverview = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getOverview();
  return successResponse({
    res,
    data,
    message: 'Admin dashboard overview retrieved successfully',
  });
});
