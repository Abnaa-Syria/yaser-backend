import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as payoutService from './admin-payout.service.js';

export const updateCommission = catchAsync(async (req: Request, res: Response) => {
  const { instructorId } = req.params;
  const { commissionRate } = req.body;
  const data = await payoutService.updateCommission(instructorId as string, commissionRate);
  return successResponse({ 
    res, 
    data, 
    message: 'Commission rate updated successfully' 
  });
});

export const getPayoutRequests = catchAsync(async (req: Request, res: Response) => {
  const data = await payoutService.getPayoutRequests(req.query);
  successResponse({ res, data, results: (data as any).payouts.length });
});

export const getPayout = catchAsync(async (req: Request, res: Response) => {
  const data = await payoutService.getPayoutById(req.params.id as string);
  successResponse({ res, data });
});

export const processPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  let receiptUrl: string | undefined = undefined;
  if (req.file) {
    receiptUrl = `/uploads/payouts/${req.file.filename}`;
  }

  const data = await payoutService.processPayout(
    id as string,
    status,
    adminNotes,
    req.user.id,
    receiptUrl
  );
  return successResponse({
    res,
    data,
    message: `Payout request marked as ${status}`,
  });
});
