import * as unitService from './admin-unit.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const createUnit = catchAsync(async (req, res) => {
    const result = await unitService.createUnit(req.body);
    successResponse({ res, data: result, message: 'Unit created successfully', statusCode: 201 });
});
export const updateUnit = catchAsync(async (req, res) => {
    const result = await unitService.updateUnit(req.params.id, req.body);
    successResponse({ res, data: result, message: 'Unit updated successfully' });
});
export const deleteUnit = catchAsync(async (req, res) => {
    const result = await unitService.deleteUnit(req.params.id);
    successResponse({ res, data: result, message: 'Unit deleted successfully' });
});
export const getUnits = catchAsync(async (req, res) => {
    const data = await unitService.getAllUnits(req.query);
    successResponse({ res, data, results: data.units.length });
});
export const getUnit = catchAsync(async (req, res) => {
    const data = await unitService.getUnitById(req.params.id);
    successResponse({ res, data });
});
//# sourceMappingURL=admin-unit.controller.js.map