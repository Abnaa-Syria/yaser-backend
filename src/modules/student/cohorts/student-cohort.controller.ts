import { Request, Response } from 'express';
import * as studentCohortService from './student-cohort.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';

export const enrollCohortHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await studentCohortService.enrollInCohort(req.user.id, String(req.params.id));
  
  successResponse({ 
    res, 
    data: result, 
    message: 'Successfully enrolled in cohort',
    statusCode: 201 
  });
});
