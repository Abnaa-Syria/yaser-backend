import * as homeworkService from './homework.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AppError } from '../../utils/AppError.js';
import { successResponse } from '../../utils/responseHandler.js';
export const createHomeworkHandler = catchAsync(async (req, res) => {
    const { courseId, ...data } = req.body;
    if (!courseId)
        throw new AppError('courseId is required', 400);
    const result = await homeworkService.createHomework(req.user.id, courseId, data);
    successResponse({ res, data: result, message: 'Homework assigned successfully', statusCode: 201 });
});
export const listCourseHomeworkHandler = catchAsync(async (req, res) => {
    const result = await homeworkService.listHomeworkForStudentCourse(req.user.id, String(req.params.courseId));
    successResponse({ res, data: result, message: 'Homework list retrieved' });
});
/** @deprecated */
export const listCohortHomeworkHandler = listCourseHomeworkHandler;
export const listMyHomeworkHandler = catchAsync(async (req, res) => {
    const result = await homeworkService.listAllHomeworkForStudent(req.user.id);
    successResponse({ res, data: result, message: 'Homework list retrieved' });
});
export const getStudentHomeworkAssignmentHandler = catchAsync(async (req, res) => {
    const result = await homeworkService.getHomeworkAssignmentForStudent(req.user.id, String(req.params.homeworkId));
    successResponse({ res, data: result, message: 'Homework retrieved' });
});
export const submitHomeworkHandler = catchAsync(async (req, res) => {
    const payload = {};
    if (req.file) {
        payload.fileUrl = `/uploads/homework/${req.file.filename}`;
        payload.content = null;
    }
    else {
        payload.content = req.body?.content ?? null;
        payload.fileUrl = req.body?.fileUrl ?? null;
    }
    const result = await homeworkService.submitHomework(req.user.id, String(req.params.id), payload);
    successResponse({ res, data: result, message: 'Homework submitted successfully', statusCode: 201 });
});
export const gradeSubmissionHandler = catchAsync(async (req, res) => {
    const { grade, feedback } = req.body;
    const result = await homeworkService.gradeSubmission(req.user.id, String(req.params.id), grade, feedback);
    successResponse({ res, data: result, message: 'Homework graded successfully' });
});
export const listPendingSubmissionsHandler = catchAsync(async (req, res) => {
    const result = await homeworkService.listInstructorHomeworkQueue(req.user.id);
    successResponse({ res, data: result, message: 'Homework queue retrieved' });
});
export const patchSubmissionReviewStatusHandler = catchAsync(async (req, res) => {
    const raw = req.body?.instructorReviewStatus;
    if (raw !== 'NOT_OPENED' &&
        raw !== 'OPENED' &&
        raw !== 'CLOSED') {
        throw new AppError('Invalid instructorReviewStatus', 400);
    }
    const result = await homeworkService.patchInstructorSubmissionReviewStatus(req.user.id, String(req.params.id), raw);
    successResponse({ res, data: result, message: 'Review status updated' });
});
export const deleteHomeworkHandler = catchAsync(async (req, res) => {
    const result = await homeworkService.deleteHomework(req.user.id, String(req.params.id));
    successResponse({ res, data: result, message: 'Homework deleted successfully' });
});
//# sourceMappingURL=homework.controller.js.map