import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as service from './public-private-session-request.service.js';

export const submitPrivateSessionRequest = catchAsync(async (req: Request, res: Response) => {
  const studentId = (req as any).user?.id as string | undefined;
  const data = await service.createPrivateSessionRequest({
    ...req.body,
    studentId,
  });
  successResponse({
    res,
    data: { id: data.id },
    message: 'Request received. We will contact you soon.',
    statusCode: 201,
  });
});
