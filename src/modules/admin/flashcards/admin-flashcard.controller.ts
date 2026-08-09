import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as flashcardService from './admin-flashcard.service.js';

export const listFlashcards = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.listFlashcards(req.query);
  successResponse({ res, data, results: data.length });
});

export const createFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.createFlashcard(req.body, req.user?.id);
  successResponse({ res, data, message: 'Flashcard created successfully', statusCode: 201 });
});

export const updateFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.updateFlashcard(req.params.id as string, req.body);
  successResponse({ res, data, message: 'Flashcard updated successfully' });
});

export const deleteFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.deleteFlashcard(req.params.id as string);
  successResponse({ res, data, message: 'Flashcard deleted successfully' });
});
