import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './admin-flashcard.controller.js';
import * as validation from './admin-flashcard.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('flashcard:manage'));
router.get('/', validate(validation.listFlashcardsSchema), controller.listFlashcards);
router.post('/', validate(validation.createFlashcardSchema), controller.createFlashcard);
router.patch('/:id', validate(validation.updateFlashcardSchema), controller.updateFlashcard);
router.delete('/:id', validate(validation.flashcardIdParamSchema), controller.deleteFlashcard);
export default router;
//# sourceMappingURL=admin-flashcard.routes.js.map