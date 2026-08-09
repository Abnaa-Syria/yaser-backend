import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as certificateService from './public-certificate.service.js';

function sendCertificatePdf(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
}

export const verifyCertificate = catchAsync(async (req: Request, res: Response) => {
  const data = await certificateService.verifyCertificate(String(req.params.serialNumber));
  return successResponse({ res, data });
});

export const downloadCertificate = catchAsync(async (req: Request, res: Response) => {
  const { buffer, filename } = await certificateService.downloadCertificateBySerial(
    String(req.params.serialNumber)
  );
  return sendCertificatePdf(res, buffer, filename);
});
