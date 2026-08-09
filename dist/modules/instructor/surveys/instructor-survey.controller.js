import * as surveyService from './instructor-survey.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
/**
 * GET /api/v1/instructor/surveys/pending/:sessionId
 * Returns active INSTRUCTOR_SELF questions that this instructor has not yet
 * answered for the given session.
 */
export const getPendingQuestions = catchAsync(async (req, res) => {
    const instructorId = req.user.id;
    const sessionId = req.params.sessionId;
    const data = await surveyService.getInstructorPendingQuestions(sessionId, instructorId);
    successResponse({ res, data });
});
/**
 * POST /api/v1/instructor/surveys/submit
 * Submits the instructor's self-evaluation answers atomically.
 * instructorId is sourced exclusively from the JWT payload — never from the body.
 */
export const submitEvaluation = catchAsync(async (req, res) => {
    const instructorId = req.user.id;
    const { sessionId, answers } = req.body;
    const data = await surveyService.submitInstructorEvaluation(sessionId, instructorId, answers);
    successResponse({
        res,
        data,
        message: 'Self-evaluation submitted successfully.',
        statusCode: 201,
    });
});
//# sourceMappingURL=instructor-survey.controller.js.map