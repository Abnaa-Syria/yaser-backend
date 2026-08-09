import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requirePermission } from '../../../middlewares/permission.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as certificateController from './admin-certificate.controller.js';
import * as certificateValidation from './admin-certificate.validation.js';
const router = Router();
router.use(protect);
router.use(requirePermission('course:manage'));
router.get('/', validate(certificateValidation.listCertificatesSchema), certificateController.getCertificates);
router.get('/:id/download', validate(certificateValidation.certificateIdParamSchema), certificateController.downloadCertificate);
router.get('/:id', validate(certificateValidation.certificateIdParamSchema), certificateController.getCertificate);
router.post('/issue', validate(certificateValidation.issueCertificateSchema), certificateController.issueCertificate);
export default router;
//# sourceMappingURL=admin-certificate.routes.js.map