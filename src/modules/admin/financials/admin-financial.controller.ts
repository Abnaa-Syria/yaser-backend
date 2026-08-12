import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import * as adminPackageService from './admin-package.service.js';
import * as adminPaymentService from './admin-payment.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { AppError } from '../../../utils/AppError.js';

export const createPackage = catchAsync(async (req: Request, res: Response) => {
  const result = await adminPackageService.createPackage(req.body);
  successResponse({ res, data: result, message: 'Package created successfully', statusCode: 201 });
});

export const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const result = await adminPackageService.updatePackage(req.params.id as string, req.body);
  successResponse({ res, data: result, message: 'Package updated successfully' });
});

export const deletePackage = catchAsync(async (req: Request, res: Response) => {
  const result = await adminPackageService.deletePackage(req.params.id as string);
  successResponse({ res, data: result, message: 'Package deleted successfully' });
});

export const getPackages = catchAsync(async (req: Request, res: Response) => {
  const data = await adminPackageService.getAllPackages();
  successResponse({ res, data, results: data.length });
});

export const getPackage = catchAsync(async (req: Request, res: Response) => {
  const data = await adminPackageService.getPackageById(req.params.id as string);
  successResponse({ res, data });
});


export const getPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await adminPaymentService.getAllPayments(req.query);
  successResponse({ res, data: result, results: result.length, message: 'Payments retrieved successfully' });
});

export const getPayment = catchAsync(async (req: Request, res: Response) => {
  const data = await adminPaymentService.getPaymentById(req.params.id as string);
  successResponse({ res, data });
});


export const approvePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await adminPaymentService.approvePayment(
    req.params.id as string,
    req.user?.id,
    req.body?.adminNote
  );
  successResponse({ res, data: result, message: 'Payment approved and access granted' });
});

export const rejectPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await adminPaymentService.rejectPayment(
    req.params.id as string,
    req.user?.id,
    req.body?.rejectionReason
  );
  successResponse({ res, data: result, message: 'Payment rejected' });
});

export const updatePaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await adminPaymentService.updatePaymentStatus(
    req.params.id as string,
    req.body.status
  );
  successResponse({ res, data: result, message: 'Payment status updated successfully' });
});

export const downloadPaymentProof = catchAsync(async (req: Request, res: Response) => {
  const payment = await adminPaymentService.getPaymentById(req.params.id as string);
  const receiptUrl = payment?.receiptUrl as string | undefined;
  if (!receiptUrl || !receiptUrl.includes('/uploads/payment-proofs/')) {
    throw new AppError('No payment proof on file', 404);
  }
  const filename = path.basename(receiptUrl);
  const absPath = path.join(process.cwd(), 'uploads', 'payment-proofs', filename);
  if (!fs.existsSync(absPath)) {
    throw new AppError('Payment proof file missing', 404);
  }
  res.setHeader('Content-Type', proofContentType(filename));
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(absPath);
});

function proofContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.pdf') return 'application/pdf';
  return 'image/jpeg';
}
