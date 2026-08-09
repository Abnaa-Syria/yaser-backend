import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as certificateService from './public-certificate.service.js';
function sendCertificatePdf(res, buffer, filename) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
}
export const verifyCertificate = catchAsync(async (req, res) => {
    const data = await certificateService.verifyCertificate(String(req.params.serialNumber));
    return successResponse({ res, data });
});
export const downloadCertificate = catchAsync(async (req, res) => {
    const { buffer, filename } = await certificateService.downloadCertificateBySerial(String(req.params.serialNumber));
    return sendCertificatePdf(res, buffer, filename);
});
//# sourceMappingURL=public-certificate.controller.js.map