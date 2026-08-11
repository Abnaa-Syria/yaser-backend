import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import * as gamificationController from './gamification.controller.js';

const router = Router();

router.use(protect);
router.use(requireRole('STUDENT'));

router.get('/me', gamificationController.getMe);
router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/badges', gamificationController.getBadges);
router.get('/challenges/current', gamificationController.getCurrentChallenge);
router.patch('/privacy', gamificationController.patchPrivacy);
router.post('/flashcard-session', gamificationController.postFlashcardSession);

export default router;
