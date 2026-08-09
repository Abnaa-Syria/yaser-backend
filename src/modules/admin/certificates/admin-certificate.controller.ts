import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as certificateService from './admin-certificate.service.js';

function sendCertificatePdf(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
}

export const issueCertificate = catchAsync(async (req: Request, res: Response) => {
  const { buffer, filename } = await certificateService.issueManualCertificate(req.user.id, req.body);
  return sendCertificatePdf(res, buffer, filename);
});

export const getCertificates = catchAsync(async (req: Request, res: Response) => {
  const data = await certificateService.getAllCertificates(req.query);
  return successResponse({ res, data, results: (data as any).certificates.length });
});

export const getCertificate = catchAsync(async (req: Request, res: Response) => {
  const data = await certificateService.getCertificateById(req.params.id as string);
  return successResponse({ res, data });
});

export const downloadCertificate = catchAsync(async (req: Request, res: Response) => {
  const { buffer, filename } = await certificateService.downloadCertificate(String(req.params.id));
  return sendCertificatePdf(res, buffer, filename);
});
