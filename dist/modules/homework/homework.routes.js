import { Router } from 'express';
import * as homeworkController from './homework.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { homeworkSubmitUpload } from '../../middlewares/homeworkUpload.middleware.js';
const router = Router();
router.use(protect);
// Instructor Routes
router.get('/instructor/pending-submissions', requireRole('INSTRUCTOR', 'ADMIN'), homeworkController.listPendingSubmissionsHandler);
router.post('/instructor', requireRole('INSTRUCTOR', 'ADMIN'), homeworkController.createHomeworkHandler);
router.patch('/instructor/submissions/:id/review-status', requireRole('INSTRUCTOR', 'ADMIN'), homeworkController.patchSubmissionReviewStatusHandler);
router.patch('/instructor/submissions/:id/grade', requireRole('INSTRUCTOR', 'ADMIN'), homeworkController.gradeSubmissionHandler);
router.delete('/instructor/:id', requireRole('INSTRUCTOR', 'ADMIN'), homeworkController.deleteHomeworkHandler);
// Student Routes (specific paths before :id)
router.get('/student/mine', requireRole('STUDENT'), homeworkController.listMyHomeworkHandler);
router.get('/student/assignments/:homeworkId', requireRole('STUDENT'), homeworkController.getStudentHomeworkAssignmentHandler);
router.get('/student/course/:courseId', requireRole('STUDENT'), homeworkController.listCourseHomeworkHandler);
router.post('/student/:id/submit', requireRole('STUDENT'), homeworkSubmitUpload.single('file'), homeworkController.submitHomeworkHandler);
export default router;
//# sourceMappingURL=homework.routes.js.map