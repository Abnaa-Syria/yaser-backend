import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as auditService from './admin-audit-log.service.js';

export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const data = await auditService.listAuditLogs(req.query as any);
  successResponse({ res, data });
});
