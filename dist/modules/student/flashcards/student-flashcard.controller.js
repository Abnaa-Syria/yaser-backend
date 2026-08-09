import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as flashcardService from './student-flashcard.service.js';
export const listMyFlashcards = catchAsync(async (req, res) => {
    const data = await flashcardService.listMyFlashcards(req.user.id, req.query);
    successResponse({ res, data, results: data.length });
});
//# sourceMappingURL=student-flashcard.controller.js.map