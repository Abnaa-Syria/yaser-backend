import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as studyPlanService from './student-study-plan.service.js';
export const listMyStudyPlans = catchAsync(async (req, res) => {
    const data = await studyPlanService.listMyStudyPlans(req.user.id);
    successResponse({ res, data, results: data.length });
});
export const createStudyPlan = catchAsync(async (req, res) => {
    const data = await studyPlanService.createStudyPlan(req.user.id, req.body);
    successResponse({ res, data, message: 'Study plan created successfully', statusCode: 201 });
});
export const updateStudyPlan = catchAsync(async (req, res) => {
    const data = await studyPlanService.updateStudyPlan(req.user.id, req.params.id, req.body);
    successResponse({ res, data, message: 'Study plan updated successfully' });
});
export const deleteStudyPlan = catchAsync(async (req, res) => {
    const data = await studyPlanService.deleteStudyPlan(req.user.id, req.params.id);
    successResponse({ res, data, message: 'Study plan deleted successfully' });
});
export const createStudyPlanItem = catchAsync(async (req, res) => {
    const data = await studyPlanService.createStudyPlanItem(req.user.id, req.params.id, req.body);
    successResponse({ res, data, message: 'Study plan item created successfully', statusCode: 201 });
});
export const updateStudyPlanItem = catchAsync(async (req, res) => {
    const data = await studyPlanService.updateStudyPlanItem(req.user.id, req.params.id, req.params.itemId, req.body);
    successResponse({ res, data, message: 'Study plan item updated successfully' });
});
export const deleteStudyPlanItem = catchAsync(async (req, res) => {
    const data = await studyPlanService.deleteStudyPlanItem(req.user.id, req.params.id, req.params.itemId);
    successResponse({ res, data, message: 'Study plan item deleted successfully' });
});
//# sourceMappingURL=student-study-plan.controller.js.map