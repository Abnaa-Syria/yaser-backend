import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as sectionService from './admin-section.service.js';
export const createSection = catchAsync(async (req, res) => {
    const data = await sectionService.createSection(req.body);
    successResponse({ res, data, message: 'Section created', statusCode: 201 });
});
export const getSections = catchAsync(async (req, res) => {
    const data = await sectionService.getSections(req.query);
    successResponse({ res, data });
});
export const getSection = catchAsync(async (req, res) => {
    const data = await sectionService.getSectionById(req.params.id);
    successResponse({ res, data });
});
export const updateSection = catchAsync(async (req, res) => {
    const data = await sectionService.updateSection(req.params.id, req.body);
    successResponse({ res, data, message: 'Section updated' });
});
export const deleteSection = catchAsync(async (req, res) => {
    const data = await sectionService.deleteSection(req.params.id);
    successResponse({ res, data, message: 'Section deleted' });
});
//# sourceMappingURL=admin-section.controller.js.map