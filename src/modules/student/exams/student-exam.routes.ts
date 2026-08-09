import { Router } from 'express';
import * as studentController from './student-exam.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as studentValidation from './student-exam.validation.js';

const router = Router();

router.use(protect);

router.get('/', studentController.getExams);
router.get('/:id', validate(studentValidation.examIdParamSchema), studentController.getExam);
router.post('/:id/start', validate(studentValidation.examIdParamSchema), studentController.startExam);
router.post('/:id/submit', validate(studentValidation.submitExamSchema), studentController.submitExam);
router.get('/:id/results/:submissionId', validate(studentValidation.resultIdParamSchema), studentController.getResults);

export default router;
