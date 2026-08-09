import { Router } from 'express';
import * as unitController from './admin-unit.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as unitValidation from './admin-unit.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('course:manage'));
router.get('/', validate(unitValidation.listUnitsSchema), unitController.getUnits);
router.get('/:id', validate(unitValidation.unitIdParamSchema), unitController.getUnit);
router.post('/', validate(unitValidation.createUnitSchema), unitController.createUnit);
router.patch('/:id', validate(unitValidation.updateUnitSchema), unitController.updateUnit);
router.delete('/:id', validate(unitValidation.unitIdParamSchema), unitController.deleteUnit);
export default router;
//# sourceMappingURL=admin-unit.routes.js.map