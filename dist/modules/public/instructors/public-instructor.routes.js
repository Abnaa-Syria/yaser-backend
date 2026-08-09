import { Router } from 'express';
import * as instructorController from './public-instructor.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as instructorValidation from './public-instructor.validation.js';
const router = Router();
router.get('/', validate(instructorValidation.listInstructorsSchema), instructorController.getInstructors);
router.get('/:id/slots', validate(instructorValidation.instructorIdParamSchema), instructorController.getInstructorSlots);
router.get('/:id/courses', validate(instructorValidation.instructorIdParamSchema), instructorController.getCourses);
router.get('/:id/reviews', validate(instructorValidation.instructorIdParamSchema), instructorController.getReviews);
router.get('/:id', validate(instructorValidation.instructorIdParamSchema), instructorController.getInstructor);
export default router;
//# sourceMappingURL=public-instructor.routes.js.map