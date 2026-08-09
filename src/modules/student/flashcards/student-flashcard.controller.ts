import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as flashcardService from './student-flashcard.service.js';

export const listMyFlashcards = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.listMyFlashcards(req.user.id, req.query);
  successResponse({ res, data, results: data.length });
});
