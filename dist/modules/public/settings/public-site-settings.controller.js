import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as publicSiteSettingsService from './public-site-settings.service.js';
export const getPublicSiteSettings = catchAsync(async (_req, res) => {
    const data = await publicSiteSettingsService.getPublicSiteSettings();
    successResponse({ res, data, message: 'Site settings retrieved' });
});
//# sourceMappingURL=public-site-settings.controller.js.map