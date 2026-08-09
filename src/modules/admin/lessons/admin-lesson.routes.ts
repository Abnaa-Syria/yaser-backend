import { Router } from 'express';
import * as lessonController from './admin-lesson.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as lessonValidation from './admin-lesson.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('course:manage'));

router.get('/', validate(lessonValidation.listLessonsSchema), lessonController.getLessons);
router.get('/:id', validate(lessonValidation.lessonIdParamSchema), lessonController.getLesson);
router.post('/', validate(lessonValidation.createLessonSchema), lessonController.createLesson);
router.patch('/:id', validate(lessonValidation.updateLessonSchema), lessonController.updateLesson);
router.delete('/:id', validate(lessonValidation.lessonIdParamSchema), lessonController.deleteLesson);


export default router;
