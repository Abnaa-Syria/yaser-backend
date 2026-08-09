import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as service from './public-instructor-application.service.js';

export const submitInstructorApplication = catchAsync(async (req: Request, res: Response) => {
  const data = await service.submitInstructorApplication(req.body);
  successResponse({
    res,
    data,
    message: 'Instructor application submitted successfully.',
    statusCode: 201,
  });
});
