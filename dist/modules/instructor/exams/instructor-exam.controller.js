import * as examService from './instructor-exam.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { generateExamSubmissionsXlsx } from '../../../utils/excelGenerator.js';
export const listExams = catchAsync(async (req, res) => {
    const result = await examService.listInstructorExams(req.user.id, req.query);
    successResponse({ res, data: result, message: 'Exams retrieved' });
});
export const getExamById = catchAsync(async (req, res) => {
    const result = await examService.getExamDetailForInstructor(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Exam retrieved' });
});
export const getCourseStructure = catchAsync(async (req, res) => {
    const result = await examService.getCourseStructureForInstructor(req.user.id, req.params.courseId);
    successResponse({ res, data: result, message: 'Course structure retrieved' });
});
export const createExam = catchAsync(async (req, res) => {
    const result = await examService.createExam(req.user.id, req.body);
    successResponse({ res, data: result, message: 'Exam created successfully', statusCode: 201 });
});
export const updateExam = catchAsync(async (req, res) => {
    const result = await examService.updateExam(req.user.id, req.params.id, req.body);
    successResponse({ res, data: result, message: 'Exam updated successfully' });
});
export const deleteExam = catchAsync(async (req, res) => {
    const result = await examService.deleteExam(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Exam deleted successfully' });
});
export const addQuestion = catchAsync(async (req, res) => {
    const result = await examService.addQuestion(req.user.id, req.params.id, req.body);
    successResponse({ res, data: result, message: 'Question added successfully', statusCode: 201 });
});
export const updateQuestion = catchAsync(async (req, res) => {
    const result = await examService.updateQuestion(req.user.id, req.params.id, req.params.questionId, req.body);
    successResponse({ res, data: result, message: 'Question updated successfully' });
});
export const removeQuestion = catchAsync(async (req, res) => {
    const result = await examService.removeQuestion(req.user.id, req.params.id, req.params.questionId);
    successResponse({ res, data: result, message: 'Question removed successfully' });
});
export const getSubmissions = catchAsync(async (req, res) => {
    const result = await examService.getExamSubmissions(req.user.id, req.params.id);
    successResponse({ res, data: result, message: 'Exam submissions retrieved' });
});
export const exportSubmissionsXlsx = catchAsync(async (req, res) => {
    const examId = req.params.id;
    const exam = await examService.getExamDetailForInstructor(req.user.id, examId);
    const submissions = await examService.getExamSubmissions(req.user.id, examId);
    const rows = submissions.map((sub) => ({
        studentName: sub.student?.fullName || 'طالب مجهول',
        studentEmail: sub.student?.email || '—',
        attempt: sub.attempt || 1,
        score: sub.totalScore !== null && sub.totalScore !== undefined ? sub.totalScore : 'قيد التصحيح',
        totalPoints: exam?.totalPoints || 100,
        status: sub.isPassed === true ? 'ناجح' : sub.isPassed === false ? 'راسب' : 'قيد التقييم',
        submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('ar-EG') : 'غير مكتمل',
    }));
    const buffer = await generateExamSubmissionsXlsx(exam?.title || 'الاختبار', rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=exam-submissions-${examId}.xlsx`);
    return res.send(buffer);
});
//# sourceMappingURL=instructor-exam.controller.js.map