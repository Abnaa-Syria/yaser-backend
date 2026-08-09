import * as adminClassService from './admin-class.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const createClass = catchAsync(async (req, res) => {
    const result = await adminClassService.createClass(req.body);
    successResponse({ res, data: result, message: 'Class created successfully', statusCode: 201 });
});
export const updateClass = catchAsync(async (req, res) => {
    const result = await adminClassService.updateClass(req.params.id, req.body);
    successResponse({ res, data: result, message: 'Class updated successfully' });
});
export const deleteClass = catchAsync(async (req, res) => {
    const result = await adminClassService.deleteClass(req.params.id);
    successResponse({ res, data: result, message: 'Class deleted successfully' });
});
export const getClasses = catchAsync(async (req, res) => {
    const data = await adminClassService.getAllClasses(req.query);
    successResponse({ res, data, results: data.classes.length });
});
export const getClass = catchAsync(async (req, res) => {
    const data = await adminClassService.getClassById(req.params.id);
    successResponse({ res, data });
});
//# sourceMappingURL=admin-class.controller.js.map