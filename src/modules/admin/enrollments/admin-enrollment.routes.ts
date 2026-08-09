import { Router } from 'express';
import * as adminController from './admin-enrollment.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminValidation from './admin-enrollment.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('enrollment:manage'));

router.get('/', validate(adminValidation.listEnrollmentsSchema), adminController.getAllEnrollments);
router.post('/', validate(adminValidation.createEnrollmentSchema), adminController.createEnrollment);
router.patch('/:id', validate(adminValidation.updateEnrollmentExpirySchema), adminController.updateEnrollmentExpiry);
router.delete('/:id', validate(adminValidation.enrollmentIdParamSchema), adminController.revokeEnrollment);

export default router;
