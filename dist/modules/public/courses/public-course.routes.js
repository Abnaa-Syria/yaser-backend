import { Router } from 'express';
import * as courseController from './public-course.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as courseValidation from './public-course.validation.js';
const router = Router();
router.get('/', validate(courseValidation.listCoursesSchema), courseController.getCourses);
router.get('/recommended', validate(courseValidation.recommendedCoursesQuerySchema), courseController.getRecommendedCourses);
router.get('/:id', validate(courseValidation.courseIdParamSchema), courseController.getCourse);
export default router;
//# sourceMappingURL=public-course.routes.js.map