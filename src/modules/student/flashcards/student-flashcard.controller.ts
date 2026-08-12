import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as flashcardService from './student-flashcard.service.js';

function readDueOnly(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return defaultValue;
}

export const listMyFlashcards = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.listMyFlashcards(req.user.id, {
    courseId: req.query.courseId as string | undefined,
    unitId: req.query.unitId as string | undefined,
    lessonId: req.query.lessonId as string | undefined,
    dueOnly: readDueOnly(req.query.dueOnly, true),
  });
  successResponse({ res, data, results: data.length });
});

export const reviewPlatformFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.reviewPlatformFlashcard(
    req.user.id,
    req.params.id as string,
    req.body.difficulty
  );
  successResponse({ res, data, message: 'Flashcard reviewed' });
});

export const listPersonalFlashcards = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.listPersonalFlashcards(req.user.id, {
    courseId: req.query.courseId as string | undefined,
    unitId: req.query.unitId as string | undefined,
    lessonId: req.query.lessonId as string | undefined,
    dueOnly: readDueOnly(req.query.dueOnly, false),
  });
  successResponse({ res, data, results: data.length });
});

export const createPersonalFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.createPersonalFlashcard(req.user.id, req.body);
  successResponse({ res, data, message: 'Flashcard created', statusCode: 201 });
});

export const updatePersonalFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.updatePersonalFlashcard(req.user.id, req.params.id as string, req.body);
  successResponse({ res, data, message: 'Flashcard updated' });
});

export const deletePersonalFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.deletePersonalFlashcard(req.user.id, req.params.id as string);
  successResponse({ res, data, message: 'Flashcard deleted' });
});

export const reviewPersonalFlashcard = catchAsync(async (req: Request, res: Response) => {
  const data = await flashcardService.reviewPersonalFlashcard(
    req.user.id,
    req.params.id as string,
    req.body.difficulty
  );
  successResponse({ res, data, message: 'Flashcard reviewed' });
});

export const getIntervals = catchAsync(async (_req: Request, res: Response) => {
  const data = await flashcardService.getFlashcardIntervals();
  successResponse({ res, data });
});
