import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as certificateService from './student-certificate.service.js';

function sendCertificatePdf(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
}

export const claimCertificate = catchAsync(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const studentId = req.user.id;

  const pdfBuffer = await certificateService.claimCertificate(studentId, courseId);

  return sendCertificatePdf(res, pdfBuffer, `certificate-${courseId}.pdf`);
});

export const getMyCertificates = catchAsync(async (req: Request, res: Response) => {
  const data = await certificateService.getMyCertificates(req.user.id);
  return successResponse({ 
    res, 
    data,
    message: 'Certificates retrieved successfully'
  });
});

export const downloadCertificate = catchAsync(async (req: Request, res: Response) => {
  const { buffer, filename } = await certificateService.downloadMyCertificate(
    req.user.id,
    String(req.params.id)
  );
  return sendCertificatePdf(res, buffer, filename);
});
