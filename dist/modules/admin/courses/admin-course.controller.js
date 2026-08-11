import * as adminCourseService from './admin-course.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const createCourse = catchAsync(async (req, res) => {
    const result = await adminCourseService.createCourse(req.body, req.user.id);
    successResponse({ res, data: result, message: 'Course created successfully', statusCode: 201 });
});
export const updateCourse = catchAsync(async (req, res) => {
    const result = await adminCourseService.updateCourse(req.params.id, req.body, req.user.id);
    successResponse({ res, data: result, message: 'Course updated successfully' });
});
export const deleteCourse = catchAsync(async (req, res) => {
    const result = await adminCourseService.deleteCourse(req.params.id, req.user.id);
    successResponse({ res, data: result, message: 'Course deleted successfully' });
});
export const assignInstructor = catchAsync(async (req, res) => {
    const result = await adminCourseService.assignInstructor(req.params.id, req.body.instructorId);
    successResponse({ res, data: result, message: 'Instructor assigned successfully' });
});
export const getAllCourses = catchAsync(async (req, res) => {
    const { courses, pagination } = await adminCourseService.getAllCourses(req.query);
    successResponse({
        res,
        data: { courses, pagination },
        results: courses.length,
        message: 'Courses fetched successfully'
    });
});
export const getCourse = catchAsync(async (req, res) => {
    const result = await adminCourseService.getCourseById(req.params.id);
    successResponse({ res, data: result, message: 'Course details fetched successfully' });
});
export const submitForReview = catchAsync(async (req, res) => {
    const result = await adminCourseService.submitCourseForReview(req.params.id, req.user.id);
    successResponse({ res, data: result, message: 'Course submitted for review' });
});
export const approveCourse = catchAsync(async (req, res) => {
    const result = await adminCourseService.approveCourse(req.params.id, req.user.id, req.body.reviewNotes);
    successResponse({ res, data: result, message: 'Course approved' });
});
export const rejectCourse = catchAsync(async (req, res) => {
    const result = await adminCourseService.rejectCourse(req.params.id, req.user.id, req.body.rejectionReason, req.body.reviewNotes);
    successResponse({ res, data: result, message: 'Course rejected' });
});
export const getReviewQueue = catchAsync(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await adminCourseService.getReviewQueue(page, limit);
    successResponse({ res, data: result });
});
export const getCourseStaff = catchAsync(async (req, res) => {
    const result = await adminCourseService.listCourseStaff(req.params.id);
    successResponse({ res, data: result });
});
export const addCourseStaff = catchAsync(async (req, res) => {
    const result = await adminCourseService.addCourseStaff(req.params.id, req.body.userId, req.body.role, req.user.id);
    successResponse({ res, data: result, message: 'Staff assigned', statusCode: 201 });
});
export const removeCourseStaff = catchAsync(async (req, res) => {
    const result = await adminCourseService.removeCourseStaff(req.params.id, req.params.staffId, req.user.id);
    successResponse({ res, data: result, message: 'Staff removed' });
});
//# sourceMappingURL=admin-course.controller.js.map