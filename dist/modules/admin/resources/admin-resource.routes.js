import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as resourceController from './admin-resource.controller.js';
import * as resourceValidation from './admin-resource.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('course:manage'));
router.get('/resources', validate(resourceValidation.listResourcesSchema), resourceController.getResources);
router.get('/resources/:resourceId', validate(resourceValidation.resourceIdParamSchema), resourceController.getResource);
router.post('/lessons/:lessonId/resources', validate(resourceValidation.createResourceSchema), resourceController.createResource);
router.delete('/resources/:resourceId', validate(resourceValidation.resourceIdParamSchema), resourceController.deleteResource);
export default router;
//# sourceMappingURL=admin-resource.routes.js.map