import { Router } from 'express';
import * as instructorController from './instructor-class.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as instructorValidation from './instructor-class.validation.js';

const router = Router();

router.use(protect);
router.use(requireRole('INSTRUCTOR'));

router.get('/', validate(instructorValidation.listCohortsQuerySchema), instructorController.listMyCourses);
router.get('/students', instructorController.getAllStudents);
router.get('/:id/students', validate(instructorValidation.classIdParamSchema), instructorController.getStudents);

export default router;
