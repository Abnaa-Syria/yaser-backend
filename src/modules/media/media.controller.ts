import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';
import { AppError } from '../../utils/AppError.js';
import { getRoleName } from '../../utils/role-query.js';
import * as mediaService from './media.service.js';

export const listMedia = catchAsync(async (req: Request, res: Response) => {
  const data = await mediaService.listMediaAssets({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 24,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
  });
  successResponse({ res, data });
});

export const uploadMedia = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('An image file is required', 400);
  const userId = (req as any).user?.id as string | undefined;
  const data = await mediaService.createMediaAssetFromUpload(req.file, userId);
  successResponse({
    res,
    data,
    message: 'Media uploaded successfully',
    statusCode: 201,
  });
});

export const deleteMedia = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = await mediaService.deleteMediaAsset(String(req.params.id), {
    id: user?.id,
    roleName: getRoleName(user),
  });
  successResponse({ res, data, message: 'Media deleted successfully' });
});
