import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as qnaController from './student-qna.controller.js';
import * as qnaValidation from './student-qna.validation.js';
const router = Router();
router.use(protect);
router.get('/questions', qnaController.getMyQuestions);
router.get('/lessons/:lessonId/questions', validate(qnaValidation.lessonIdParamSchema), qnaController.getLessonQuestions);
router.post('/lessons/:lessonId/questions', validate(qnaValidation.createQuestionSchema), qnaController.createQuestion);
router.post('/questions/:questionId/answers', validate(qnaValidation.createAnswerSchema), qnaController.createAnswer);
export default router;
//# sourceMappingURL=student-qna.routes.js.map