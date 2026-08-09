import { Router } from 'express';
import * as adminController from './admin-instructor.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminValidation from './admin-instructor.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('instructor:manage'));
router.get('/', validate(adminValidation.listInstructorsSchema), adminController.getAllInstructors);
router.get('/:id/performance', validate(adminValidation.instructorIdParamSchema), adminController.getInstructorPerformance);
router.get('/:id/availability', validate(adminValidation.instructorIdParamSchema), adminController.getInstructorAvailability);
router.get('/:id', validate(adminValidation.instructorIdParamSchema), adminController.getInstructor);
router.post('/', validate(adminValidation.createInstructorSchema), adminController.createInstructor);
router.patch('/:id', validate(adminValidation.updateInstructorSchema), adminController.updateInstructor);
router.delete('/:id', validate(adminValidation.instructorIdParamSchema), adminController.deleteInstructor);
export default router;
//# sourceMappingURL=admin-instructor.routes.js.map