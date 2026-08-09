import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as certificateService from './admin-certificate.service.js';
function sendCertificatePdf(res, buffer, filename) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
}
export const issueCertificate = catchAsync(async (req, res) => {
    const { buffer, filename } = await certificateService.issueManualCertificate(req.user.id, req.body);
    return sendCertificatePdf(res, buffer, filename);
});
export const getCertificates = catchAsync(async (req, res) => {
    const data = await certificateService.getAllCertificates(req.query);
    return successResponse({ res, data, results: data.certificates.length });
});
export const getCertificate = catchAsync(async (req, res) => {
    const data = await certificateService.getCertificateById(req.params.id);
    return successResponse({ res, data });
});
export const downloadCertificate = catchAsync(async (req, res) => {
    const { buffer, filename } = await certificateService.downloadCertificate(String(req.params.id));
    return sendCertificatePdf(res, buffer, filename);
});
//# sourceMappingURL=admin-certificate.controller.js.map