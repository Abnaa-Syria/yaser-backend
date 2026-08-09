import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as contactService from './public-contact.service.js';

export const submitContact = catchAsync(async (req: Request, res: Response) => {
  const data = await contactService.createContactSubmission(req.body);
  successResponse({
    res,
    data: { id: data.id },
    message: 'Message received. We will get back to you soon.',
    statusCode: 201,
  });
});
