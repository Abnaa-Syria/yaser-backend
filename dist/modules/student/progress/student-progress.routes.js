import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import * as progressController from './student-progress.controller.js';
const router = Router();
router.use(protect);
router.use(requireRole('STUDENT'));
router.post('/lessons/:lessonId/access', progressController.trackLessonAccess);
router.post('/lessons/:lessonId/complete', progressController.markAsCompleted);
router.get('/courses/:courseId/resume', progressController.getResumeState);
router.get('/courses/:courseId/completed-lessons', progressController.getCompletedLessons);
router.get('/courses/:courseId/stats', progressController.getProgressStats);
export default router;
//# sourceMappingURL=student-progress.routes.js.map