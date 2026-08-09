import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as qnaService from './instructor-qna.service.js';

export const replyToQuestion = catchAsync(async (req: Request, res: Response) => {
  const questionId = String(req.params.questionId);
  const instructorId = req.user.id;

  const data = await qnaService.replyToQuestion(instructorId, questionId, req.body.body);

  return successResponse({
    res,
    data,
    statusCode: 201,
    message: 'Instructor reply posted successfully',
  });
});

export const toggleResolve = catchAsync(async (req: Request, res: Response) => {
  const questionId = String(req.params.questionId);
  const instructorId = req.user.id;

  const data = await qnaService.toggleResolve(instructorId, questionId);

  return successResponse({
    res,
    data,
    message: `Question marked as ${data.isResolved ? 'resolved' : 'unresolved'}`,
  });
});

export const listQuestions = catchAsync(async (req: Request, res: Response) => {
  const { courseId, lessonId, page, limit, resolved } = req.query;
  const result = await qnaService.listInstructorQuestions(req.user.id, {
    courseId: courseId as string | undefined,
    lessonId: lessonId as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    resolved: resolved as string | undefined,
  });
  return successResponse({
    res,
    data: result.questions,
    message: 'Questions retrieved successfully',
    meta: result.pagination,
  });
});
