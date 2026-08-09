import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { payoutReceiptUpload } from '../../../middlewares/payoutUpload.middleware.js';
import * as payoutController from './admin-payout.controller.js';
import * as payoutValidation from './admin-payout.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('payout:manage'));

router.patch(
  '/instructors/:instructorId/commission',
  validate(payoutValidation.updateCommissionSchema),
  payoutController.updateCommission
);

router.get(
  '/payouts',
  validate(payoutValidation.listPayoutsSchema),
  payoutController.getPayoutRequests
);

router.get(
  '/payouts/:id',
  payoutController.getPayout
);


router.patch(
  '/payouts/:id/process',
  payoutReceiptUpload.single('receipt'),
  validate(payoutValidation.processPayoutSchema),
  payoutController.processPayout
);

export default router;
