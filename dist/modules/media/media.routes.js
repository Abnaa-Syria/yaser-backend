import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { mediaUpload } from '../../middlewares/mediaUpload.middleware.js';
import * as mediaController from './media.controller.js';
const router = Router();
router.use(protect);
router.use(requireRole('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'));
router.get('/', mediaController.listMedia);
router.post('/upload', mediaUpload.single('file'), mediaController.uploadMedia);
router.delete('/:id', mediaController.deleteMedia);
export default router;
//# sourceMappingURL=media.routes.js.map