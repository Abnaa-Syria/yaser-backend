import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as supportService from './support.service.js';
// Student
export const createTicket = catchAsync(async (req, res) => {
    const data = await supportService.createTicket(req.user.id, req.body);
    successResponse({ res, data, message: 'Support ticket opened successfully', statusCode: 201 });
});
export const createTicketAsAdmin = catchAsync(async (req, res) => {
    const { creatorId, ...rest } = req.body;
    const data = await supportService.createTicketForUser(creatorId, req.user.id, rest);
    successResponse({ res, data, message: 'Support ticket created for user', statusCode: 201 });
});
export const getMyTickets = catchAsync(async (req, res) => {
    const data = await supportService.getMyTickets(req.user.id);
    successResponse({ res, data });
});
export const replyToTicket = catchAsync(async (req, res) => {
    const data = await supportService.replyToTicket(req.user.id, req.params.id, req.body.message);
    successResponse({ res, data, message: 'Reply sent successfully' });
});
// Admin
export const getAllTickets = catchAsync(async (req, res) => {
    const data = await supportService.getAllTickets(req.query);
    successResponse({ res, data });
});
export const adminReplyToTicket = catchAsync(async (req, res) => {
    const data = await supportService.adminReplyToTicket(req.params.id, req.user.id, req.body.message);
    successResponse({ res, data, message: 'Reply sent successfully' });
});
export const processTicket = catchAsync(async (req, res) => {
    const { status, response } = req.body;
    const data = await supportService.processTicket(req.params.id, req.user.id, status, response);
    successResponse({ res, data, message: 'Ticket processed successfully' });
});
export const getTicket = catchAsync(async (req, res) => {
    const data = await supportService.getTicketById(req.params.id);
    successResponse({ res, data, message: 'Ticket details fetched successfully' });
});
//# sourceMappingURL=support.controller.js.map