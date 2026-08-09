import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as progressController from './student-progress.controller.js';
import * as progressValidation from './student-progress.validation.js';

const router = Router();

router.use(protect);
router.use(requireRole('STUDENT'));

router.post(
  '/lessons/:lessonId/access',
  validate(progressValidation.trackLessonAccessSchema),
  progressController.trackLessonAccess
);
router.post(
  '/lessons/:lessonId/complete',
  validate(progressValidation.completeLessonSchema),
  progressController.markAsCompleted
);

router.get(
  '/courses/:courseId/resume',
  validate(progressValidation.courseIdParamSchema),
  progressController.getResumeState
);
router.get(
  '/courses/:courseId/completed-lessons',
  validate(progressValidation.courseIdParamSchema),
  progressController.getCompletedLessons
);
router.get(
  '/courses/:courseId/stats',
  validate(progressValidation.courseIdParamSchema),
  progressController.getProgressStats
);

export default router;
