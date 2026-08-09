import { Request, Response } from 'express';
import * as studentExamService from './student-exam.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const getExams = catchAsync(async (req: Request, res: Response) => {
  const result = await studentExamService.getAvailableExams(req.user.id, {
    courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
    unitId: typeof req.query.unitId === 'string' ? req.query.unitId : undefined,
    lessonId: typeof req.query.lessonId === 'string' ? req.query.lessonId : undefined,
  });
  successResponse({ res, data: result, message: 'Available exams retrieved successfully' });
});

export const getExam = catchAsync(async (req: Request, res: Response) => {
  const result = await studentExamService.getExamDetails(req.user.id, req.params.id as string);
  successResponse({ res, data: result, message: 'Exam details retrieved' });
});

export const startExam = catchAsync(async (req: Request, res: Response) => {
  const result = await studentExamService.startExam(req.user.id, req.params.id as string);
  successResponse({ res, data: result, message: 'Exam started', statusCode: 201 });
});

export const submitExam = catchAsync(async (req: Request, res: Response) => {
  const result = await studentExamService.submitExam(req.user.id, req.params.id as string, req.body.answers);
  successResponse({ res, data: result, message: 'Exam submitted and graded successfully' });
});

export const getResults = catchAsync(async (req: Request, res: Response) => {
  const result = await studentExamService.getSubmissionResult(req.user.id, req.params.submissionId as string);
  successResponse({ res, data: result, message: 'Exam results retrieved' });
});
