import { Router } from 'express';
import * as adminStudentController from './admin-student.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminStudentValidation from './admin-student.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('user:manage'));
router.get('/:id/performance', validate(adminStudentValidation.studentIdParamSchema), adminStudentController.getStudentPerformance);
export default router;
//# sourceMappingURL=admin-student.routes.js.map