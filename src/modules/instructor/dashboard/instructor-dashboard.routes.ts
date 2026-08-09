import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import * as instructorDashboardController from './instructor-dashboard.controller.js';

const router = Router();

router.use(protect);
router.use(requireRole('INSTRUCTOR'));

router.get('/overview', instructorDashboardController.getOverview);

export default router;
