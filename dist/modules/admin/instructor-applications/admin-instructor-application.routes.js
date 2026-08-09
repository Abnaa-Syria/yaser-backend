import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './admin-instructor-application.controller.js';
import * as validation from './admin-instructor-application.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('instructor_application:manage'));
router.get('/', validate(validation.listApplicationsSchema), controller.listInstructorApplications);
router.get('/:id', validate(validation.applicationIdParamSchema), controller.getInstructorApplication);
router.patch('/:id', validate(validation.updateApplicationSchema), controller.updateInstructorApplication);
export default router;
//# sourceMappingURL=admin-instructor-application.routes.js.map