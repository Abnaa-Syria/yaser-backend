import * as courseService from './public-course.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const getCourses = catchAsync(async (req, res) => {
    const result = await courseService.getPublicCourses(req.query);
    // Public catalog contract: response.data is the course array; response.meta is pagination.
    successResponse({
        res,
        data: result.courses,
        message: 'Courses retrieved successfully',
        meta: result.pagination
    });
});
export const getRecommendedCourses = catchAsync(async (req, res) => {
    const result = await courseService.getRecommendedPublicCourses(req.query);
    successResponse({ res, data: result, message: 'Recommended courses retrieved successfully' });
});
export const getCourse = catchAsync(async (req, res) => {
    const result = await courseService.getPublicCourseById(String(req.params.id));
    successResponse({ res, data: result, message: 'Course details retrieved' });
});
//# sourceMappingURL=public-course.controller.js.map