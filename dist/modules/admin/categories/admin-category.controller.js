import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as categoryService from './admin-category.service.js';
export const createCategory = catchAsync(async (req, res) => {
    const data = await categoryService.createCategory(req.body);
    return successResponse({
        res,
        data,
        statusCode: 201,
        message: 'Category created successfully'
    });
});
export const updateCategory = catchAsync(async (req, res) => {
    const data = await categoryService.updateCategory(String(req.params.id), req.body);
    return successResponse({
        res,
        data,
        message: 'Category updated successfully'
    });
});
export const deleteCategory = catchAsync(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);
    return successResponse({
        res,
        message: 'Category deleted successfully'
    });
});
export const getCategories = catchAsync(async (req, res) => {
    const data = await categoryService.getAllCategories(req.query);
    return successResponse({ res, data, results: data.categories.length });
});
export const getCategory = catchAsync(async (req, res) => {
    const data = await categoryService.getCategoryById(req.params.id);
    return successResponse({ res, data });
});
//# sourceMappingURL=admin-category.controller.js.map