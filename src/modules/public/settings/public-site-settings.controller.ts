import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as publicSiteSettingsService from './public-site-settings.service.js';

export const getPublicSiteSettings = catchAsync(async (_req: Request, res: Response) => {
  const data = await publicSiteSettingsService.getPublicSiteSettings();
  successResponse({ res, data, message: 'Site settings retrieved' });
});
