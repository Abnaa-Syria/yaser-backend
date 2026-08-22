import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { AppError } from '../../../utils/AppError.js';
import * as settingsService from './admin-settings.service.js';

// --- Settings ---
export const getSettings = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.getAllSettings();
  successResponse({ res, data });
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.updateSettings(req.body);
  successResponse({ res, data, message: 'Settings updated successfully' });
});

export const uploadLogo = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('A logo image is required', 400);
  }
  successResponse({
    res,
    data: { url: `/uploads/branding/${req.file.filename}` },
    message: 'Logo uploaded successfully',
    statusCode: 201,
  });
});

export const uploadPaymentMethodAsset = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('An image is required', 400);
  }
  successResponse({
    res,
    data: { url: `/uploads/payment-methods/${req.file.filename}` },
    message: 'Payment method asset uploaded successfully',
    statusCode: 201,
  });
});

// --- Emails ---
export const getEmailTemplates = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.getAllEmailTemplates();
  successResponse({ res, data });
});

export const createEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.createEmailTemplate(req.body);
  successResponse({ res, data, message: 'Email template created successfully', statusCode: 201 });
});

export const updateEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.updateEmailTemplate(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Email template updated successfully' });
});

export const deleteEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  await settingsService.deleteEmailTemplate(req.params.id as string);
  successResponse({ res, message: 'Email template deleted successfully' });
});

export const previewEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.previewEmailTemplate({
    id: req.body.id || req.params.id,
    subject: req.body.subject,
    body: req.body.body,
    vars: req.body.vars,
  });
  successResponse({ res, data });
});

export const sendTestEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.sendTestEmailTemplate({
    id: req.body.id || req.params.id,
    to: req.body.to,
    subject: req.body.subject,
    body: req.body.body,
    vars: req.body.vars,
  });
  successResponse({ res, data, message: 'Test email sent successfully' });
});

export const sendBroadcastEmail = catchAsync(async (req: Request, res: Response) => {
  const data = await settingsService.sendBroadcastEmail(req.body);
  successResponse({
    res,
    data,
    message: `Email sent to ${data.sent} of ${data.recipientCount} recipients`,
  });
});
