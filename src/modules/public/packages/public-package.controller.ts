import { Request, Response } from 'express';
import * as packageService from './public-package.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const getPackages = catchAsync(async (req: Request, res: Response) => {
  const result = await packageService.getPackages();
  successResponse({ res, data: result, message: 'Packages retrieved successfully' });
});

export const getPackage = catchAsync(async (req: Request, res: Response) => {
  const result = await packageService.getPackageById(req.params.id as string);
  successResponse({ res, data: result, message: 'Package details retrieved' });
});
