import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as service from './admin-private-session-request.service.js';

export const listRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await service.listPrivateSessionRequests(req.query as Record<string, unknown>);
  successResponse({
    res,
    data: result.requests,
    message: 'Private session requests retrieved',
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
});

export const updateRequest = catchAsync(async (req: Request, res: Response) => {
  const data = await service.updatePrivateSessionRequest(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Request updated' });
});
