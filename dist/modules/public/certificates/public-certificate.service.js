import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { certificateLinkMeta, getCertificatePdfBufferBySerial, } from '../../shared/certificate-pdf.service.js';
import { APP_BRAND } from '../../../config/brand.config.js';
export const verifyCertificate = async (serialNumber) => {
    const certificate = await prisma.certificate.findUnique({
        where: { serialNumber },
        include: {
            student: { select: { fullName: true } },
            course: { select: { title: true } }
        }
    });
    if (!certificate)
        throw new AppError('Certificate not found or invalid', 404);
    return {
        studentName: certificate.student.fullName,
        title: certificate.title,
        courseName: certificate.course?.title || `${APP_BRAND.name} Program`,
        issuedAt: certificate.issuedAt,
        serialNumber: certificate.serialNumber,
        status: 'VERIFIED',
        links: certificateLinkMeta(certificate),
    };
};
export const downloadCertificateBySerial = async (serialNumber) => {
    const buffer = await getCertificatePdfBufferBySerial(serialNumber);
    return { buffer, filename: `certificate-${serialNumber}.pdf` };
};
//# sourceMappingURL=public-certificate.service.js.map