import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { optionalProtect } from '../../../middlewares/auth.middleware.js';
import * as controller from './public-private-session-request.controller.js';
import * as validation from './public-private-session-request.validation.js';
const router = Router();
router.post('/', optionalProtect, validate(validation.createPrivateSessionRequestSchema), controller.submitPrivateSessionRequest);
export default router;
//# sourceMappingURL=public-private-session-request.routes.js.map