import { Router } from 'express';
import * as eventController from '../../admin/events/event.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { eventIdParamSchema } from '../../admin/events/event.validation.js';

const router = Router();

// Public routes for events - no auth required
router.get('/', eventController.getPublicEvents);
router.get('/:id', validate(eventIdParamSchema), eventController.getPublicEventById);

export default router;
