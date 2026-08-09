import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// All notification routes are protected and scoped to the logged-in user
router.use(protect);

router.get('/', notificationController.getNotificationsHandler);
router.patch('/read-all', notificationController.markAllAsReadHandler);
router.patch('/:id/read', notificationController.markAsReadHandler);

export default router;
