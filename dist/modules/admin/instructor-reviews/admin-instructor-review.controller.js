import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as service from './admin-instructor-review.service.js';
export const list = catchAsync(async (req, res) => {
    const data = await service.listInstructorReviews({
        instructorId: req.query.instructorId ? String(req.query.instructorId) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        includeHidden: req.query.includeHidden !== 'false',
    });
    return successResponse({ res, data, results: data.reviews.length });
});
export const create = catchAsync(async (req, res) => {
    const data = await service.createInstructorReview(req.body, req.user?.id);
    return successResponse({ res, data, message: 'Review created', statusCode: 201 });
});
export const update = catchAsync(async (req, res) => {
    const data = await service.updateInstructorReview(String(req.params.id), req.body, req.user?.id);
    return successResponse({ res, data, message: 'Review updated' });
});
export const remove = catchAsync(async (req, res) => {
    const data = await service.deleteInstructorReview(String(req.params.id), req.user?.id);
    return successResponse({ res, data, message: 'Review deleted' });
});
//# sourceMappingURL=admin-instructor-review.controller.js.map