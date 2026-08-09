import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as certificateController from './public-certificate.controller.js';
import * as certificateValidation from './public-certificate.validation.js';

const router = Router();

router.get('/verify/:serialNumber/download', validate(certificateValidation.verifySchema), certificateController.downloadCertificate);
router.get('/verify/:serialNumber', validate(certificateValidation.verifySchema), certificateController.verifyCertificate);

export default router;
