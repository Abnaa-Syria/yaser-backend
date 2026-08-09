import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as categoryController from './admin-category.controller.js';
import * as categoryValidation from './admin-category.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('course:manage'));
router.get('/', validate(categoryValidation.listCategoriesSchema), categoryController.getCategories);
router.get('/:id', validate(categoryValidation.categoryIdParamSchema), categoryController.getCategory);
router.post('/', validate(categoryValidation.createCategorySchema), categoryController.createCategory);
router.patch('/:id', validate(categoryValidation.updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', validate(categoryValidation.categoryIdParamSchema), categoryController.deleteCategory);
export default router;
//# sourceMappingURL=admin-category.routes.js.map