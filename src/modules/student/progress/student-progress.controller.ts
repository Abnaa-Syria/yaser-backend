import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as progressService from './student-progress.service.js';

export const markAsCompleted = catchAsync(async (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const { courseId } = req.body;

  const data = await progressService.completeLesson(req.user.id, lessonId, courseId);
  successResponse({ res, data, message: 'Lesson marked as completed' });
});

export const trackLessonAccess = catchAsync(async (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const { watchPercentage, courseId, lastWatchedPosition, timeSpentDelta } = req.body;

  const data = await progressService.trackAccess(req.user.id, lessonId, watchPercentage, courseId, {
    lastWatchedPosition,
    timeSpentDelta,
  });
  successResponse({ res, data });
});

export const getResumeState = catchAsync(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const data = await progressService.resumeCourse(req.user.id, courseId);
  successResponse({ res, data });
});

export const getCompletedLessons = catchAsync(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const ids = await progressService.listCompletedLessonIds(req.user.id, courseId);
  successResponse({ res, data: { lessonIds: ids }, message: 'Completed lessons retrieved' });
});

export const getProgressStats = catchAsync(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);

  const purchase = await progressService.calculateCourseProgress(req.user.id, courseId);

  successResponse({
    res,
    data: {
      completedLessons: purchase.completedLessonsCount,
      totalLessons: purchase.totalLessons,
      percentage: purchase.progressPercentage,
      isCourseCompleted: purchase.isCompleted,
    },
  });
});
