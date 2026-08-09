import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as flashcardService from './admin-flashcard.service.js';
export const listFlashcards = catchAsync(async (req, res) => {
    const data = await flashcardService.listFlashcards(req.query);
    successResponse({ res, data, results: data.length });
});
export const createFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.createFlashcard(req.body, req.user?.id);
    successResponse({ res, data, message: 'Flashcard created successfully', statusCode: 201 });
});
export const updateFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.updateFlashcard(req.params.id, req.body);
    successResponse({ res, data, message: 'Flashcard updated successfully' });
});
export const deleteFlashcard = catchAsync(async (req, res) => {
    const data = await flashcardService.deleteFlashcard(req.params.id);
    successResponse({ res, data, message: 'Flashcard deleted successfully' });
});
//# sourceMappingURL=admin-flashcard.controller.js.map