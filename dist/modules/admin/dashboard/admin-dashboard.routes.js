import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import * as dashboardController from './admin-dashboard.controller.js';
const router = Router();
router.use(protect);
router.use(requirePermission('dashboard:read'));
router.get('/stats', dashboardController.getStats);
router.get('/overview', dashboardController.getOverview);
export default router;
//# sourceMappingURL=admin-dashboard.routes.js.map