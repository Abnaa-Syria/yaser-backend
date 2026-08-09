import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as resourceService from './student-resource.service.js';

export const getLessonResources = catchAsync(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user.id;

  const data = await resourceService.getLessonResources(userId, lessonId as string);

  return successResponse({
    res,
    data,
    message: 'Lesson resources retrieved',
  });
});
