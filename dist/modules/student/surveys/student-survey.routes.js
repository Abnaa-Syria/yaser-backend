import { Router } from 'express';
import * as surveyController from './student-survey.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as surveyValidation from './student-survey.validation.js';
const router = Router();
// All student survey routes require authentication
router.use(protect);
// GET  /api/v1/student/surveys/pending/:sessionId
// Returns active, unanswered questions for the session grouped by category
router.get('/pending/:sessionId', validate(surveyValidation.sessionIdParamSchema), surveyController.getPendingQuestions);
// POST /api/v1/student/surveys/submit
// Accepts and persists a batch of survey answers atomically
router.post('/submit', validate(surveyValidation.submitSurveySchema), surveyController.submitSurvey);
export default router;
//# sourceMappingURL=student-survey.routes.js.map