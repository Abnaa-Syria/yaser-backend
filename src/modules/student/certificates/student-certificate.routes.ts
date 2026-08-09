import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as certificateController from './student-certificate.controller.js';
import * as certificateValidation from './student-certificate.validation.js';

const router = Router();

router.use(protect);

router.post(
  '/courses/:courseId/certificates/claim',
  validate(certificateValidation.courseIdParamSchema),
  certificateController.claimCertificate
);

router.get('/certificates', certificateController.getMyCertificates);

router.get(
  '/certificates/:id/download',
  validate(certificateValidation.certificateIdParamSchema),
  certificateController.downloadCertificate
);

export default router;
