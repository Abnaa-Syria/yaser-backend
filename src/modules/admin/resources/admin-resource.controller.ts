import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as resourceService from './admin-resource.service.js';

export const createResource = catchAsync(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const data = await resourceService.createResource(lessonId as string, req.body);

  return successResponse({
    res,
    data,
    statusCode: 201,
    message: 'Resource created successfully',
  });
});

export const deleteResource = catchAsync(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  await resourceService.deleteResource(resourceId as string);

  return successResponse({
    res,
    message: 'Resource deleted successfully',
  });
});

export const getResources = catchAsync(async (req: Request, res: Response) => {
  const data = await resourceService.getAllResources(req.query);
  return successResponse({ res, data, results: (data as any).resources.length });
});

export const getResource = catchAsync(async (req: Request, res: Response) => {
  const data = await resourceService.getResourceById(req.params.resourceId as string);
  return successResponse({ res, data });
});

