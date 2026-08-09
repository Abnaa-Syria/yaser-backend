import * as instructorStudentService from './instructor-student.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const listStudents = catchAsync(async (req, res) => {
    const { courseId, search, page, limit } = req.query;
    const result = await instructorStudentService.listInstructorStudents(req.user.id, {
        courseId: courseId,
        search: search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    successResponse({
        res,
        data: result.students,
        message: 'Students retrieved successfully',
        meta: result.pagination,
    });
});
export const getStudentPerformance = catchAsync(async (req, res) => {
    const result = await instructorStudentService.getStudentPerformanceForInstructor(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Student performance retrieved' });
});
//# sourceMappingURL=instructor-student.controller.js.map