import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as walletController from './instructor-wallet.controller.js';
import * as walletValidation from './instructor-wallet.validation.js';
const router = Router();
router.use(protect);
router.use(requireRole('INSTRUCTOR'));
router.get('/', walletController.getWalletDetails);
router.get('/transactions', validate(walletValidation.querySchema), walletController.getTransactions);
router.get('/payouts', walletController.getPayoutRequests);
router.post('/payouts', validate(walletValidation.payoutRequestSchema), walletController.requestPayout);
export default router;
//# sourceMappingURL=instructor-wallet.routes.js.map