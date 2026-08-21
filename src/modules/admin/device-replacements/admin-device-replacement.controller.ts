import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as deviceReplacementService from '../../auth/device-replacement.service.js';

export const listRequests = catchAsync(async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const data = await deviceReplacementService.listDeviceReplacementRequests(status);
  successResponse({ res, data, message: 'Device replacement requests' });
});

export const approveRequest = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await deviceReplacementService.approveDeviceReplacement(
    id,
    req.user!.id,
    req.body?.note
  );
  successResponse({ res, data, message: 'Device replacement approved' });
});

export const rejectRequest = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await deviceReplacementService.rejectDeviceReplacement(
    id,
    req.user!.id,
    req.body?.note
  );
  successResponse({ res, data, message: 'Device replacement rejected' });
});
