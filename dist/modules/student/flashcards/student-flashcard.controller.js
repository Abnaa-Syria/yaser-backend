import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as flashcardService from './student-flashcard.service.js';
function readDueOnly(value, defaultValue) {
    if (value === undefined || value === null || value === '')
        return defaultValue;
    if (value === true || value === 'true' || value === '1')
        return true;
    if (value === false || value === 'false' || value === '0')
        return false;
    return defaultValue;
}
export const listMyFlashcards = catchAsync(async (req, res) => {
    const data = await flashcardService.listMyFlashcards(req.user.id, {
        courseId: req.query.courseId,
        unitId: req.query.unitId,
        lessonId: req.query.lessonId,
        dueOnly: readDueOnly(req.query.dueOnly, true),
    });
    successResponse({ res, data, results: data.length });
});
export const reviewPlatformFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.reviewPlatformFlashcard(req.user.id, req.params.id, req.body.difficulty);
    successResponse({ res, data, message: 'Flashcard reviewed' });
});
export const listPersonalFlashcards = catchAsync(async (req, res) => {
    const data = await flashcardService.listPersonalFlashcards(req.user.id, {
        courseId: req.query.courseId,
        unitId: req.query.unitId,
        lessonId: req.query.lessonId,
        dueOnly: readDueOnly(req.query.dueOnly, false),
    });
    successResponse({ res, data, results: data.length });
});
export const createPersonalFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.createPersonalFlashcard(req.user.id, req.body);
    successResponse({ res, data, message: 'Flashcard created', statusCode: 201 });
});
export const updatePersonalFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.updatePersonalFlashcard(req.user.id, req.params.id, req.body);
    successResponse({ res, data, message: 'Flashcard updated' });
});
export const deletePersonalFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.deletePersonalFlashcard(req.user.id, req.params.id);
    successResponse({ res, data, message: 'Flashcard deleted' });
});
export const reviewPersonalFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.reviewPersonalFlashcard(req.user.id, req.params.id, req.body.difficulty);
    successResponse({ res, data, message: 'Flashcard reviewed' });
});
export const getIntervals = catchAsync(async (_req, res) => {
    const data = await flashcardService.getFlashcardIntervals();
    successResponse({ res, data });
});
//# sourceMappingURL=student-flashcard.controller.js.map