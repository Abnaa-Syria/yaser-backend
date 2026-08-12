import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import * as financialService from './student-financial.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { AppError } from '../../../utils/AppError.js';
import { PAYMENT_PROOF_UPLOAD_DIR } from '../../../middlewares/paymentProofUpload.middleware.js';

function proofContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.pdf') return 'application/pdf';
  return 'image/jpeg';
}

export const courseCheckout = catchAsync(async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  const result = await financialService.createCoursePurchasePayment(req.user.id, courseId, req.body);
  const message = result.reusedPending
    ? 'You already have a pending payment for this course.'
    : 'Course purchase submitted. Transfer funds and wait for approval.';
  successResponse({ res, data: result, message, statusCode: 201 });
});

export const packageCheckout = catchAsync(async (req: Request, res: Response) => {
  const packageId = req.params.packageId as string;
  const result = await financialService.createPackagePurchasePayment(req.user.id, packageId, req.body);
  const message = result.reusedPending
    ? 'You already have a pending payment for this package.'
    : 'Package purchase submitted. Transfer funds and wait for approval.';
  successResponse({ res, data: result, message, statusCode: 201 });
});

export const privateCheckout = catchAsync(async (req: Request, res: Response) => {
  const availabilityId = req.params.availabilityId as string;
  const result = await financialService.createPrivateSessionPayment(
    req.user.id,
    availabilityId,
    req.body
  );
  const message = result.reusedPending
    ? 'You already have a pending payment for this session.'
    : 'Private session payment submitted. Wait for approval.';
  successResponse({ res, data: result, message, statusCode: 201 });
});

export const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await financialService.getMyPayments(req.user.id);
  successResponse({ res, data: result, message: 'Payments retrieved successfully' });
});

export const downloadMyPaymentProof = catchAsync(async (req: Request, res: Response) => {
  const payment = await financialService.getMyPaymentById(req.user.id, req.params.id as string);
  const receiptUrl = payment?.receiptUrl as string | undefined;
  if (
    !receiptUrl ||
    !receiptUrl.includes('/uploads/payment-proofs/') ||
    receiptUrl.startsWith('INSTANT_FREE')
  ) {
    throw new AppError('No payment proof on file', 404);
  }
  const filename = path.basename(receiptUrl);
  const absPath = path.join(PAYMENT_PROOF_UPLOAD_DIR, filename);
  if (!fs.existsSync(absPath)) {
    throw new AppError('Payment proof file missing', 404);
  }
  res.setHeader('Content-Type', proofContentType(filename));
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(absPath);
});

export const uploadPaymentProof = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No payment proof file uploaded.', 400);
  }
  const result = {
    receiptUrl: `/uploads/payment-proofs/${req.file.filename}`,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  };
  successResponse({ res, data: result, message: 'Payment proof uploaded successfully', statusCode: 201 });
});

export const getMyPurchasedCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await financialService.getMyPurchasedCourses(req.user.id);
  successResponse({ res, data: result, message: 'Purchased courses retrieved successfully' });
});

export const getMyPackageBalances = catchAsync(async (req: Request, res: Response) => {
  const result = await financialService.getMyPackageBalances(req.user.id);
  successResponse({ res, data: result, message: 'Purchased packages retrieved successfully' });
});

export const getMySubscriptions = getMyPackageBalances;
