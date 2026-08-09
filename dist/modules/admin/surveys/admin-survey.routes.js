import { Router } from 'express';
import * as surveyController from './admin-survey.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as surveyValidation from './admin-survey.validation.js';
const router = Router();
// All admin survey routes require authentication and the survey:manage permission
router.use(protect);
router.use(requirePermission('survey:manage'));
// GET    /api/v1/admin/surveys/questions         — List all questions (active + inactive)
router.get('/questions', surveyController.listQuestions);
// POST   /api/v1/admin/surveys/questions         — Create a new survey question
router.post('/questions', validate(surveyValidation.createSurveyQuestionSchema), surveyController.createQuestion);
// PATCH  /api/v1/admin/surveys/questions/:id     — Update content or toggle isActive
router.patch('/questions/:id', validate(surveyValidation.updateSurveyQuestionSchema), surveyController.updateQuestion);
// DELETE /api/v1/admin/surveys/questions/:id     — Safely delete (guarded if responses exist)
router.delete('/questions/:id', validate(surveyValidation.surveyQuestionIdParamSchema), surveyController.deleteQuestion);
export default router;
//# sourceMappingURL=admin-survey.routes.js.map