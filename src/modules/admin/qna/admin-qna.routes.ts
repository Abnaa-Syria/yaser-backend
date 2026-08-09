import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as qnaController from './admin-qna.controller.js';
import * as qnaValidation from './admin-qna.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('support:manage'));

router.get(
  '/questions',
  validate(qnaValidation.listQuestionsQuerySchema),
  qnaController.listQuestions
);

router.post(
  '/questions/:questionId/answers',
  validate(qnaValidation.adminAnswerSchema),
  qnaController.replyToQuestion
);

router.patch(
  '/questions/:questionId/resolve',
  validate(qnaValidation.questionIdParamSchema),
  qnaController.toggleResolve
);

export default router;
