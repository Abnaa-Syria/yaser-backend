import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as roleController from './admin-role.controller.js';
import * as roleValidation from './admin-role.validation.js';

const router = Router();

router.use(protect);

router.get('/permissions', requirePermission('role:manage'), roleController.getPermissions);
router.get('/', requirePermission('role:manage'), roleController.getRoles);
router.post('/', requirePermission('role:manage'), validate(roleValidation.createRoleSchema), roleController.createRole);
router.patch('/:id', requirePermission('role:manage'), validate(roleValidation.updateRoleSchema), roleController.updateRole);
router.put(
  '/:id/permissions',
  requirePermission('role:manage'),
  validate(roleValidation.setPermissionsSchema),
  roleController.setRolePermissions
);
router.delete('/:id', requirePermission('role:manage'), roleController.deleteRole);

export default router;
