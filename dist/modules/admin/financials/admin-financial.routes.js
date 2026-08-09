import { Router } from 'express';
import * as adminFinanceController from './admin-financial.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminFinanceValidation from './admin-financial.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('finance:manage'));
// Package Management
router.get('/packages', adminFinanceController.getPackages);
router.get('/packages/:id', validate(adminFinanceValidation.packageIdParamSchema), adminFinanceController.getPackage);
router.post('/packages', validate(adminFinanceValidation.createPackageSchema), adminFinanceController.createPackage);
router.patch('/packages/:id', validate(adminFinanceValidation.updatePackageSchema), adminFinanceController.updatePackage);
router.delete('/packages/:id', validate(adminFinanceValidation.packageIdParamSchema), adminFinanceController.deletePackage);
// Payment Review
router.get('/payments', adminFinanceController.getPayments);
router.get('/payments/:id', validate(adminFinanceValidation.paymentIdParamSchema), adminFinanceController.getPayment);
router.patch('/payments/:id/status', validate(adminFinanceValidation.updatePaymentStatusSchema), adminFinanceController.updatePaymentStatus);
router.patch('/payments/:id/approve', validate(adminFinanceValidation.approvePaymentSchema), adminFinanceController.approvePayment);
router.patch('/payments/:id/reject', validate(adminFinanceValidation.rejectPaymentSchema), adminFinanceController.rejectPayment);
export default router;
//# sourceMappingURL=admin-financial.routes.js.map