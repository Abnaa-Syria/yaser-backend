import { Request, Response } from 'express';
import * as unitService from './admin-unit.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const createUnit = catchAsync(async (req: Request, res: Response) => {
  const result = await unitService.createUnit(req.body);
  successResponse({ res, data: result, message: 'Unit created successfully', statusCode: 201 });
});

export const updateUnit = catchAsync(async (req: Request, res: Response) => {
  const result = await unitService.updateUnit(req.params.id as string, req.body);
  successResponse({ res, data: result, message: 'Unit updated successfully' });
});

export const deleteUnit = catchAsync(async (req: Request, res: Response) => {
  const result = await unitService.deleteUnit(req.params.id as string);
  successResponse({ res, data: result, message: 'Unit deleted successfully' });
});

export const getUnits = catchAsync(async (req: Request, res: Response) => {
  const data = await unitService.getAllUnits(req.query);
  successResponse({ res, data, results: (data as any).units.length });
});

export const getUnit = catchAsync(async (req: Request, res: Response) => {
  const data = await unitService.getUnitById(req.params.id as string);
  successResponse({ res, data });
});

