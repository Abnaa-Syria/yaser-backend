import { catchAsync } from '../../../utils/catchAsync.js';
import { AppError } from '../../../utils/AppError.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as resourceService from './admin-resource.service.js';
export const createResource = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const data = await resourceService.createResource(lessonId, req.body);
    return successResponse({
        res,
        data,
        statusCode: 201,
        message: 'Resource created successfully',
    });
});
export const uploadResource = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    if (!req.file)
        throw new AppError('A file is required', 400);
    const title = typeof req.body?.title === 'string' ? req.body.title : undefined;
    const data = await resourceService.createResourceFromUpload(lessonId, req.file, title);
    return successResponse({
        res,
        data,
        statusCode: 201,
        message: 'Resource uploaded successfully',
    });
});
export const getLessonResources = catchAsync(async (req, res) => {
    const data = await resourceService.listLessonResources(req.params.lessonId);
    return successResponse({ res, data, results: data.length });
});
export const deleteResource = catchAsync(async (req, res) => {
    const { resourceId } = req.params;
    await resourceService.deleteResource(resourceId);
    return successResponse({
        res,
        message: 'Resource deleted successfully',
    });
});
export const getResources = catchAsync(async (req, res) => {
    const data = await resourceService.getAllResources(req.query);
    return successResponse({ res, data, results: data.resources.length });
});
export const getResource = catchAsync(async (req, res) => {
    const data = await resourceService.getResourceById(req.params.resourceId);
    return successResponse({ res, data });
});
//# sourceMappingURL=admin-resource.controller.js.map