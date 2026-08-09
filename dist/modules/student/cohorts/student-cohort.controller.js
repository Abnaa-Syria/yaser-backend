import * as studentCohortService from './student-cohort.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
export const enrollCohortHandler = catchAsync(async (req, res) => {
    const result = await studentCohortService.enrollInCohort(req.user.id, String(req.params.id));
    successResponse({
        res,
        data: result,
        message: 'Successfully enrolled in cohort',
        statusCode: 201
    });
});
//# sourceMappingURL=student-cohort.controller.js.map