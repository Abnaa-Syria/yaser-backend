import { Request, Response } from 'express';
import * as panelService from './instructor-panel.service.js';
import * as performanceService from '../instructor/performance/instructor-performance.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';

export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const result = await panelService.getDashboardStats(req.user.id);
  successResponse({ res, data: result, message: 'Dashboard stats retrieved' });
});

export const getClasses = catchAsync(async (req: Request, res: Response) => {
  const result = await panelService.getInstructorClasses(req.user.id, req.query);
  successResponse({ res, data: result.classes, message: 'Classes retrieved successfully', meta: result.pagination });
});

export const getPerformance = catchAsync(async (req: Request, res: Response) => {
  const result = await performanceService.getInstructorPerformanceDashboard(req.user.id);
  successResponse({ res, data: result, message: 'Performance metrics retrieved' });
});
