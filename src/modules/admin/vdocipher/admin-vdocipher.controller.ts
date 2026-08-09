import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as vdoService from './admin-vdocipher.service.js';

export const getStatus = catchAsync(async (_req: Request, res: Response) => {
  const data = vdoService.getLibraryStatus();
  successResponse({ res, data, message: 'VdoCipher status' });
});

export const listVideos = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const data = await vdoService.listVideos({ page, limit, q });
  successResponse({ res, data, results: data.rows.length, message: 'VdoCipher videos retrieved' });
});
