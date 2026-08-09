import * as lessonService from './admin-lesson.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const createLesson = catchAsync(async (req, res) => {
    const result = await lessonService.createLesson(req.body);
    successResponse({ res, data: result, message: 'Lesson created successfully', statusCode: 201 });
});
export const updateLesson = catchAsync(async (req, res) => {
    const result = await lessonService.updateLesson(req.params.id, req.body);
    successResponse({ res, data: result, message: 'Lesson updated successfully' });
});
export const deleteLesson = catchAsync(async (req, res) => {
    const result = await lessonService.deleteLesson(req.params.id);
    successResponse({ res, data: result, message: 'Lesson deleted successfully' });
});
export const getLessons = catchAsync(async (req, res) => {
    const data = await lessonService.getAllLessons(req.query);
    successResponse({ res, data, results: data.lessons.length });
});
export const getLesson = catchAsync(async (req, res) => {
    const data = await lessonService.getLessonById(req.params.id);
    successResponse({ res, data });
});
//# sourceMappingURL=admin-lesson.controller.js.map