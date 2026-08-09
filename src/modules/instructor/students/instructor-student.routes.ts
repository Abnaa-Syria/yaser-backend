import { Router } from 'express';
import * as instructorStudentController from './instructor-student.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as instructorStudentValidation from './instructor-student.validation.js';

const router = Router();

router.use(protect);
router.use(requireRole('INSTRUCTOR'));

router.get(
  '/',
  validate(instructorStudentValidation.listStudentsQuerySchema),
  instructorStudentController.listStudents
);

router.get(
  '/:id/performance',
  validate(instructorStudentValidation.studentIdParamSchema),
  instructorStudentController.getStudentPerformance
);

export default router;
