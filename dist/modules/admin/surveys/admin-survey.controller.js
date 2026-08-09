import * as surveyService from './admin-survey.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const listQuestions = catchAsync(async (_req, res) => {
    const data = await surveyService.listSurveyQuestions();
    successResponse({ res, data, results: data.length });
});
export const createQuestion = catchAsync(async (req, res) => {
    const data = await surveyService.createSurveyQuestion(req.body);
    successResponse({ res, data, message: 'Survey question created successfully.', statusCode: 201 });
});
export const updateQuestion = catchAsync(async (req, res) => {
    const data = await surveyService.updateSurveyQuestion(req.params.id, req.body);
    successResponse({ res, data, message: 'Survey question updated successfully.' });
});
export const deleteQuestion = catchAsync(async (req, res) => {
    const data = await surveyService.deleteSurveyQuestion(req.params.id);
    successResponse({ res, data, message: 'Survey question deleted successfully.' });
});
//# sourceMappingURL=admin-survey.controller.js.map