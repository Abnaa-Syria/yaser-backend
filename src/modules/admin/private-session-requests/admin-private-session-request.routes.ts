import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './admin-private-session-request.controller.js';
import * as validation from './admin-private-session-request.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('instructor:manage'));

router.get('/', validate(validation.listPrivateSessionRequestsSchema), controller.listRequests);
router.patch('/:id', validate(validation.updatePrivateSessionRequestSchema), controller.updateRequest);

export default router;
