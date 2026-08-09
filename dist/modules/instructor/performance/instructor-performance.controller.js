import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as performanceService from './instructor-performance.service.js';
import { generateEvaluationReportPDF } from '../../../utils/pdfGenerator.js';
export const getPerformance = catchAsync(async (req, res) => {
    const data = await performanceService.getInstructorPerformanceDashboard(req.user.id);
    successResponse({ res, data, message: 'Performance metrics retrieved' });
});
export const exportPerformancePdf = catchAsync(async (req, res) => {
    const data = await performanceService.getInstructorPerformanceDashboard(req.user.id);
    const reportData = {
        title: req.user.fullName || 'المحاضر',
        subtitle: 'تقرير تقييم الأداء والمراجعات الطلابية للمحاضر',
        overallRating: data.reviews.overallRating,
        totalResponses: data.reviews.totalResponses,
        distribution: data.reviews.distribution,
        questionBreakdown: (data.reviews.questionBreakdown || []).map((q) => ({
            question: q.question,
            avgRating: q.avgRating,
            responses: q.responses,
        })),
    };
    const pdfBuffer = await generateEvaluationReportPDF(reportData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=instructor-performance-report.pdf');
    return res.send(pdfBuffer);
});
//# sourceMappingURL=instructor-performance.controller.js.map