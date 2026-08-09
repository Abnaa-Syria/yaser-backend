import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as qnaService from './admin-qna.service.js';

export const replyToQuestion = catchAsync(async (req: Request, res: Response) => {
  const questionId = String(req.params.questionId);
  const adminId = req.user.id;

  const data = await qnaService.replyToQuestion(adminId, questionId, req.body.body);

  return successResponse({
    res,
    data,
    statusCode: 201,
    message: 'Admin reply posted successfully',
  });
});

export const toggleResolve = catchAsync(async (req: Request, res: Response) => {
  const questionId = String(req.params.questionId);

  const data = await qnaService.toggleResolve(questionId);

  return successResponse({
    res,
    data,
    message: `Question marked as ${data.isResolved ? 'resolved' : 'unresolved'}`,
  });
});

export const listQuestions = catchAsync(async (req: Request, res: Response) => {
  const { courseId, lessonId, page, limit, resolved, search } = req.query;
  const result = await qnaService.listAdminQuestions({
    courseId: courseId as string | undefined,
    lessonId: lessonId as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    resolved: resolved as string | undefined,
    search: search as string | undefined,
  });
  return successResponse({
    res,
    data: result.questions,
    message: 'Questions retrieved successfully',
    meta: result.pagination,
  });
});
