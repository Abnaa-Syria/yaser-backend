import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as sectionController from './admin-section.controller.js';
import * as sectionValidation from './admin-section.validation.js';

const router = Router();

router.use(protect);
router.use(requirePermission('curriculum:manage'));

router.get('/', validate(sectionValidation.listSectionsSchema), sectionController.getSections);
router.get('/:id', validate(sectionValidation.sectionIdParamSchema), sectionController.getSection);
router.post('/', validate(sectionValidation.createSectionSchema), sectionController.createSection);
router.patch('/:id', validate(sectionValidation.updateSectionSchema), sectionController.updateSection);
router.delete('/:id', validate(sectionValidation.sectionIdParamSchema), sectionController.deleteSection);

export default router;
