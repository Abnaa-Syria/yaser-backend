import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import * as adminGamificationController from './admin-gamification.controller.js';
const router = Router();
router.use(protect);
router.use(requirePermission('settings:manage'));
router.get('/stats', adminGamificationController.getStats);
router.get('/challenges', adminGamificationController.listChallenges);
router.post('/challenges', adminGamificationController.createChallenge);
router.post('/seed-badges', adminGamificationController.seedBadges);
export default router;
//# sourceMappingURL=admin-gamification.routes.js.map