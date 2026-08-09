import { Request, Response } from 'express';
import * as lessonService from './admin-lesson.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const createLesson = catchAsync(async (req: Request, res: Response) => {
  const result = await lessonService.createLesson(req.body);
  successResponse({ res, data: result, message: 'Lesson created successfully', statusCode: 201 });
});

export const updateLesson = catchAsync(async (req: Request, res: Response) => {
  const result = await lessonService.updateLesson(req.params.id as string, req.body);
  successResponse({ res, data: result, message: 'Lesson updated successfully' });
});

export const deleteLesson = catchAsync(async (req: Request, res: Response) => {
  const result = await lessonService.deleteLesson(req.params.id as string);
  successResponse({ res, data: result, message: 'Lesson deleted successfully' });
});

export const getLessons = catchAsync(async (req: Request, res: Response) => {
  const data = await lessonService.getAllLessons(req.query);
  successResponse({ res, data, results: (data as any).lessons.length });
});

export const getLesson = catchAsync(async (req: Request, res: Response) => {
  const data = await lessonService.getLessonById(req.params.id as string);
  successResponse({ res, data });
});

