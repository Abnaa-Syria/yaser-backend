import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as qnaService from './student-qna.service.js';
export const getLessonQuestions = catchAsync(async (req, res) => {
    const lessonId = String(req.params.lessonId);
    const studentId = req.user.id;
    const data = await qnaService.getLessonQuestions(studentId, lessonId);
    return successResponse({
        res,
        data,
        message: 'Lesson questions retrieved',
    });
});
export const createQuestion = catchAsync(async (req, res) => {
    const lessonId = String(req.params.lessonId);
    const studentId = req.user.id;
    const data = await qnaService.createQuestion(studentId, lessonId, req.body);
    return successResponse({
        res,
        data,
        statusCode: 201,
        message: 'Question posted successfully',
    });
});
export const createAnswer = catchAsync(async (req, res) => {
    const questionId = String(req.params.questionId);
    const studentId = req.user.id;
    const data = await qnaService.createAnswer(studentId, questionId, req.body.body);
    return successResponse({
        res,
        data,
        statusCode: 201,
        message: 'Answer posted successfully',
    });
});
export const getMyQuestions = catchAsync(async (req, res) => {
    const studentId = req.user.id;
    const data = await qnaService.getMyQuestions(studentId);
    return successResponse({
        res,
        data,
        message: 'My questions retrieved',
    });
});
//# sourceMappingURL=student-qna.controller.js.map