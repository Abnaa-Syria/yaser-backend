import { Router } from 'express';
import * as eventController from './event.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { createEventSchema, updateEventSchema, eventIdParamSchema, } from './event.validation.js';
const router = Router();
// All admin event routes require auth + 'event:manage' permission
router.use(protect);
router.use(requirePermission('event:manage'));
router.post('/', validate(createEventSchema), eventController.createEvent);
router.get('/', eventController.getEventsForAdmin);
router.patch('/:id', validate(eventIdParamSchema), validate(updateEventSchema), eventController.updateEvent);
router.delete('/:id', validate(eventIdParamSchema), eventController.deleteEvent);
export default router;
//# sourceMappingURL=admin-event.routes.js.map