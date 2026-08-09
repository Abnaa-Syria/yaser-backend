import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import * as adminTrialService from './admin-trial.service.js';

export const getTrialAdmin = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminTrialService.getAdminTrialSettings();
  res.status(200).json({ success: true, data });
});

export const patchTrialSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await adminTrialService.updateAdminTrialSettings(req.body);
  res.status(200).json({ success: true, message: 'Trial settings updated', data: { settings } });
});

export const putTrialCourses = catchAsync(async (req: Request, res: Response) => {
  const data = await adminTrialService.replaceTrialCourses(req.body.courses || []);
  res.status(200).json({ success: true, message: 'Trial courses updated', data });
});

export const listSessions = catchAsync(async (req: Request, res: Response) => {
  const data = await adminTrialService.listTrialSessions({
    status: typeof req.query.status === 'string' ? (req.query.status as 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ALL') : 'ALL',
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
  });
  res.status(200).json({ success: true, data });
});

export const revokeSession = catchAsync(async (req: Request, res: Response) => {
  const data = await adminTrialService.revokeTrialSession(
    String(req.params.id),
    typeof req.body?.reason === 'string' ? req.body.reason : undefined
  );
  res.status(200).json({ success: true, message: 'Trial stopped on this device', data });
});

export const restoreSession = catchAsync(async (req: Request, res: Response) => {
  const data = await adminTrialService.restoreTrialSession(String(req.params.id));
  res.status(200).json({ success: true, message: 'Trial restored on this device', data });
});
