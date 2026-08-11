import { Router } from 'express';
import * as courseController from './instructor-course.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as courseValidation from './instructor-course.validation.js';
const router = Router();
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
// Course CRUD for Instructors
router.get('/', validate(courseValidation.listCoursesQuerySchema), courseController.getMyCourses);
router.get('/:id', validate(courseValidation.courseIdParamSchema), courseController.getCourseById);
router.post('/', validate(courseValidation.createCourseSchema), courseController.createCourse);
router.patch('/:id', validate(courseValidation.updateCourseSchema), courseController.updateCourse);
router.delete('/:id', validate(courseValidation.courseIdParamSchema), courseController.deleteCourse);
router.post('/:id/submit-review', validate(courseValidation.courseIdParamSchema), courseController.submitForReview);
export default router;
//# sourceMappingURL=instructor-course.routes.js.map