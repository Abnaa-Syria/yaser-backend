import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as playbackService from './student-playback.service.js';

export const getLessonPlayback = catchAsync(async (req: Request, res: Response) => {
  const lessonId = req.params.lessonId as string;
  const data = await playbackService.getLessonPlayback(req.user.id, lessonId, req.user.email);
  return successResponse({
    res,
    data,
    message: 'Lesson playback authorized',
  });
});
