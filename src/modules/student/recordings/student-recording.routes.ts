import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as recordingController from './student-recording.controller.js';
import * as recordingValidation from './student-recording.validation.js';

const router = Router();

router.use(protect);

router.get('/', recordingController.getRecordings);
router.get(
  '/:sourceType/:id',
  validate(recordingValidation.recordingDetailParamSchema),
  recordingController.getRecordingDetail
);
router.post(
  '/:sourceType/:id/notes',
  validate(recordingValidation.createPlaybackNoteSchema),
  recordingController.createNote
);
router.patch(
  '/:sourceType/:id/notes/:noteId',
  validate(recordingValidation.updatePlaybackNoteSchema),
  recordingController.updateNote
);
router.delete(
  '/:sourceType/:id/notes/:noteId',
  validate(recordingValidation.recordingNoteParamSchema),
  recordingController.deleteNote
);

export default router;
