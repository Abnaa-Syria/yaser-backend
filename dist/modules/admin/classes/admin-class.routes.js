import { Router } from 'express';
import * as adminController from './admin-class.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as adminValidation from './admin-class.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('class:manage'));
router.get('/', validate(adminValidation.listClassesSchema), adminController.getClasses);
router.get('/:id', validate(adminValidation.classIdParamSchema), adminController.getClass);
router.post('/', validate(adminValidation.createClassSchema), adminController.createClass);
router.patch('/:id', validate(adminValidation.updateClassSchema), adminController.updateClass);
router.delete('/:id', validate(adminValidation.classIdParamSchema), adminController.deleteClass);
export default router;
//# sourceMappingURL=admin-class.routes.js.map