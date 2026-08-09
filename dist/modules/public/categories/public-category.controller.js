import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as categoryService from './public-category.service.js';
export const getCategories = catchAsync(async (req, res) => {
    const data = await categoryService.getAllCategories();
    return successResponse({ res, data });
});
export const getCategoryBySlug = catchAsync(async (req, res) => {
    const data = await categoryService.getCategoryBySlug(String(req.params.slug));
    return successResponse({ res, data });
});
//# sourceMappingURL=public-category.controller.js.map