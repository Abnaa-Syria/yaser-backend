import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as controller from './student-flashcard.controller.js';
import * as validation from './student-flashcard.validation.js';

const router = Router();

router.use(protect);

router.get('/', validate(validation.listPersonalFlashcardsSchema), controller.listPersonalFlashcards);
router.post('/', validate(validation.createPersonalFlashcardSchema), controller.createPersonalFlashcard);
router.patch('/:id', validate(validation.updatePersonalFlashcardSchema), controller.updatePersonalFlashcard);
router.delete('/:id', validate(validation.personalFlashcardIdSchema), controller.deletePersonalFlashcard);
router.post('/:id/review', validate(validation.reviewPersonalFlashcardSchema), controller.reviewPersonalFlashcard);

export default router;
