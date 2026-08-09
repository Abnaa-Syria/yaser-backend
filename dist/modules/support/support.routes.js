import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as supportController from './support.controller.js';
import { createTicketSchema, replyTicketSchema, processTicketSchema, adminCreateTicketSchema } from './support.validation.js';
const router = Router();
router.use(protect);
router.post('/student/tickets', requireRole('STUDENT', 'INSTRUCTOR'), validate(createTicketSchema), supportController.createTicket);
router.get('/student/tickets', requireRole('STUDENT', 'INSTRUCTOR'), supportController.getMyTickets);
router.post('/student/tickets/:id/message', requireRole('STUDENT', 'INSTRUCTOR'), validate(replyTicketSchema), supportController.replyToTicket);
router.get('/admin/tickets', requirePermission('support:manage'), supportController.getAllTickets);
router.post('/admin/tickets', requirePermission('support:manage'), validate(adminCreateTicketSchema), supportController.createTicketAsAdmin);
router.get('/admin/tickets/:id', requirePermission('support:manage'), supportController.getTicket);
router.post('/admin/tickets/:id/message', requirePermission('support:manage'), validate(replyTicketSchema), supportController.adminReplyToTicket);
router.patch('/admin/tickets/:id/process', requirePermission('support:manage'), validate(processTicketSchema), supportController.processTicket);
export default router;
//# sourceMappingURL=support.routes.js.map