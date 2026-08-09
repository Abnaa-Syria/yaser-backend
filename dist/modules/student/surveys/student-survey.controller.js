import * as surveyService from './student-survey.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
/**
 * GET /api/v1/student/surveys/pending/:sessionId
 * Returns all active, unanswered survey questions grouped by category for the
 * requesting student in the context of the given session.
 */
export const getPendingQuestions = catchAsync(async (req, res) => {
    const studentId = req.user.id;
    const sessionId = req.params.sessionId;
    const data = await surveyService.getPendingSurveyQuestions(sessionId, studentId);
    successResponse({ res, data });
});
/**
 * POST /api/v1/student/surveys/submit
 * Accepts a batch of answers and persists them atomically.
 * Blocks duplicate submissions via DB unique constraint + pre-flight check.
 */
export const submitSurvey = catchAsync(async (req, res) => {
    const studentId = req.user.id;
    const { sessionId, answers } = req.body;
    const data = await surveyService.submitSurveyResponses(sessionId, studentId, answers);
    successResponse({ res, data, message: 'Survey submitted successfully. Thank you!', statusCode: 201 });
});
//# sourceMappingURL=student-survey.controller.js.map