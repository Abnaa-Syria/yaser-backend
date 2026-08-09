import { Router } from 'express';
import * as studentController from './student-course.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as studentValidation from './student-course.validation.js';

const router = Router();

router.use(protect);

router.get('/my-courses', studentController.getMyCourses);
router.get('/recommended', validate(studentValidation.recommendedCoursesQuerySchema), studentController.getRecommendedCourses);
router.get('/:id/units', validate(studentValidation.courseIdParamSchema), studentController.getCourseContent);
router.get('/:id/exams', validate(studentValidation.courseIdParamSchema), studentController.getCourseExams);

export default router;
