import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './student-flashcard.controller.js';
import * as validation from './student-flashcard.validation.js';
const router = Router();
router.use(protect);
router.get('/', validate(validation.listFlashcardsSchema), controller.listMyFlashcards);
export default router;
//# sourceMappingURL=student-flashcard.routes.js.map