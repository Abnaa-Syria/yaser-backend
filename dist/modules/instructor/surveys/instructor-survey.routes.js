import { Router } from 'express';
import * as surveyController from './instructor-survey.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as surveyValidation from './instructor-survey.validation.js';
const router = Router();
// All instructor survey routes: authenticated + INSTRUCTOR role only
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
// GET  /api/v1/instructor/surveys/pending/:sessionId
// Returns active INSTRUCTOR_SELF questions the instructor hasn't answered for this session
router.get('/pending/:sessionId', validate(surveyValidation.sessionIdParamSchema), surveyController.getPendingQuestions);
// POST /api/v1/instructor/surveys/submit
// Atomically submits the instructor's post-session self-evaluation
router.post('/submit', validate(surveyValidation.submitInstructorEvaluationSchema), surveyController.submitEvaluation);
export default router;
//# sourceMappingURL=instructor-survey.routes.js.map