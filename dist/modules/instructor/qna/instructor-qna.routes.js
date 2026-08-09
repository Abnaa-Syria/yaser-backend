import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as qnaController from './instructor-qna.controller.js';
import * as qnaValidation from './instructor-qna.validation.js';
const router = Router();
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
router.get('/questions', validate(qnaValidation.listQuestionsQuerySchema), qnaController.listQuestions);
router.post('/questions/:questionId/answers', validate(qnaValidation.instructorAnswerSchema), qnaController.replyToQuestion);
router.patch('/questions/:questionId/resolve', validate(qnaValidation.questionIdParamSchema), qnaController.toggleResolve);
export default router;
//# sourceMappingURL=instructor-qna.routes.js.map