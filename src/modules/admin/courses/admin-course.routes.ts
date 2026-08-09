import { Router } from 'express';
import * as adminController from './admin-course.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminValidation from './admin-course.validation.js';

const router = Router();

router.use(protect);

router.get(
  '/review-queue',
  requirePermission('course:review'),
  adminController.getReviewQueue
);

router.use(requirePermission('course:manage'));

router.get('/', validate(adminValidation.listCoursesSchema), adminController.getAllCourses);
router.get('/:id', validate(adminValidation.courseIdParamSchema), adminController.getCourse);
router.post('/', validate(adminValidation.createCourseSchema), adminController.createCourse);
router.patch('/:id', validate(adminValidation.updateCourseSchema), adminController.updateCourse);
router.delete('/:id', validate(adminValidation.courseIdParamSchema), adminController.deleteCourse);
router.patch(
  '/:id/assign-instructor',
  validate(adminValidation.assignInstructorSchema),
  adminController.assignInstructor
);
router.post('/:id/submit-review', validate(adminValidation.courseIdParamSchema), adminController.submitForReview);
router.patch(
  '/:id/approve',
  requirePermission('course:review'),
  validate(adminValidation.reviewActionSchema),
  adminController.approveCourse
);
router.patch(
  '/:id/reject',
  requirePermission('course:review'),
  validate(adminValidation.rejectCourseSchema),
  adminController.rejectCourse
);
router.get('/:id/staff', validate(adminValidation.courseIdParamSchema), adminController.getCourseStaff);
router.post(
  '/:id/staff',
  requirePermission('course:staff:manage'),
  validate(adminValidation.addStaffSchema),
  adminController.addCourseStaff
);
router.delete(
  '/:id/staff/:staffId',
  requirePermission('course:staff:manage'),
  validate(adminValidation.staffIdParamSchema),
  adminController.removeCourseStaff
);

export default router;
