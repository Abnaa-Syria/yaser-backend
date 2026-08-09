import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as adminContactService from './admin-contact.service.js';

export const listSubmissions = catchAsync(async (req: Request, res: Response) => {
  const data = await adminContactService.listContactSubmissions(req.query as Record<string, unknown>);
  successResponse({ res, data, message: 'Contact submissions retrieved' });
});

export const updateSubmissionStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await adminContactService.updateContactSubmissionStatus(
    req.params.id as string,
    req.body.status
  );
  successResponse({ res, data, message: 'Submission updated' });
});
