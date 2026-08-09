import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as eventService from './event.service.js';
// ─── Admin Controller Actions ──────────────────────────────────────────────────
export const createEvent = catchAsync(async (req, res) => {
    const data = await eventService.createEvent(req.body);
    successResponse({
        res,
        data,
        message: 'Event created successfully.',
        statusCode: 201,
    });
});
export const getEventsForAdmin = catchAsync(async (req, res) => {
    const { page, limit } = req.query;
    const data = await eventService.getAllEventsForAdmin({ page, limit });
    successResponse({ res, data });
});
export const updateEvent = catchAsync(async (req, res) => {
    const id = req.params.id;
    const data = await eventService.updateEvent(id, req.body);
    successResponse({
        res,
        data,
        message: 'Event updated successfully.',
    });
});
export const deleteEvent = catchAsync(async (req, res) => {
    const id = req.params.id;
    await eventService.deleteEvent(id);
    successResponse({
        res,
        message: 'Event deleted successfully.',
    });
});
// ─── Public Controller Actions ──────────────────────────────────────────────────
export const getPublicEvents = catchAsync(async (req, res) => {
    const data = await eventService.getPublicActiveEvents();
    successResponse({ res, data });
});
export const getPublicEventById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const data = await eventService.getPublicActiveEventById(id);
    successResponse({ res, data });
});
//# sourceMappingURL=event.controller.js.map