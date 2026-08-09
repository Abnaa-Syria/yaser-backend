import * as packageService from './public-package.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const getPackages = catchAsync(async (req, res) => {
    const result = await packageService.getPackages();
    successResponse({ res, data: result, message: 'Packages retrieved successfully' });
});
export const getPackage = catchAsync(async (req, res) => {
    const result = await packageService.getPackageById(req.params.id);
    successResponse({ res, data: result, message: 'Package details retrieved' });
});
//# sourceMappingURL=public-package.controller.js.map