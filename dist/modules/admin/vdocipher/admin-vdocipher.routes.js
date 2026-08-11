import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './admin-vdocipher.controller.js';
import * as validation from './admin-vdocipher.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('course:manage'));
router.get('/status', controller.getStatus);
router.get('/videos', validate(validation.listVideosQuerySchema), controller.listVideos);
export default router;
//# sourceMappingURL=admin-vdocipher.routes.js.map