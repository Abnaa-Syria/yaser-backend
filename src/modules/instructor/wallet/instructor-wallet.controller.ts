import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as walletService from './instructor-wallet.service.js';

export const getWalletDetails = catchAsync(async (req: Request, res: Response) => {
  const data = await walletService.getOrCreateWallet(req.user.id);
  return successResponse({ 
    res, 
    data,
    message: 'Wallet details retrieved'
  });
});

export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const data = await walletService.getTransactions(req.user.id, page, limit);
  return successResponse({ 
    res, 
    data,
    message: 'Wallet transactions retrieved'
  });
});

export const getPayoutRequests = catchAsync(async (req: Request, res: Response) => {
  const data = await walletService.getPayoutRequests(req.user.id);
  return successResponse({ 
    res, 
    data,
    message: 'Payout history retrieved'
  });
});

export const requestPayout = catchAsync(async (req: Request, res: Response) => {
  const data = await walletService.createPayoutRequest(req.user.id, req.body);
  return successResponse({
    res,
    data,
    statusCode: 201,
    message: 'Payout request submitted successfully',
  });
});
