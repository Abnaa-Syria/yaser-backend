import fs from 'fs';
import path from 'path';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { generateCertificatePDF } from '../../utils/pdfGenerator.js';
import { APP_BRAND } from '../../config/brand.config.js';
const CERT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'certificates');
function ensureCertDir() {
    fs.mkdirSync(CERT_UPLOAD_DIR, { recursive: true });
}
function pdfPathForSerial(serialNumber) {
    const safe = serialNumber.replace(/[^\w-]+/g, '_');
    return path.join(CERT_UPLOAD_DIR, `${safe}.pdf`);
}
function publicPdfUrl(serialNumber) {
    const safe = serialNumber.replace(/[^\w-]+/g, '_');
    return `/uploads/certificates/${safe}.pdf`;
}
async function loadCertificateRecord(id) {
    const cert = await prisma.certificate.findUnique({
        where: { id },
        include: {
            student: { select: { fullName: true } },
            course: { select: { title: true } },
        },
    });
    if (!cert)
        throw new AppError('Certificate not found.', 404);
    return cert;
}
async function loadCertificateBySerial(serialNumber) {
    const cert = await prisma.certificate.findUnique({
        where: { serialNumber },
        include: {
            student: { select: { fullName: true } },
            course: { select: { title: true } },
        },
    });
    if (!cert)
        throw new AppError('Certificate not found.', 404);
    return cert;
}
export async function renderCertificatePdf(cert) {
    return generateCertificatePDF({
        studentName: cert.student.fullName,
        courseName: cert.course?.title || cert.title || `${APP_BRAND.name} Program`,
        date: cert.issuedAt.toLocaleDateString('ar-EG'),
        serialNumber: cert.serialNumber,
    });
}
export async function persistCertificatePdf(cert) {
    const buffer = await renderCertificatePdf(cert);
    ensureCertDir();
    const filePath = pdfPathForSerial(cert.serialNumber);
    fs.writeFileSync(filePath, buffer);
    const pdfUrl = publicPdfUrl(cert.serialNumber);
    if (cert.pdfUrl !== pdfUrl) {
        await prisma.certificate.update({
            where: { id: cert.id },
            data: { pdfUrl },
        });
    }
    return buffer;
}
export async function getCertificatePdfBufferById(certificateId) {
    const cert = await loadCertificateRecord(certificateId);
    // Always regenerate so brand logo / template updates apply to existing certificates.
    return persistCertificatePdf(cert);
}
export async function getCertificatePdfBufferBySerial(serialNumber) {
    const cert = await loadCertificateBySerial(serialNumber);
    return getCertificatePdfBufferById(cert.id);
}
export function certificateLinkMeta(cert) {
    const encodedSerial = encodeURIComponent(cert.serialNumber);
    return {
        pdfUrl: cert.pdfUrl || publicPdfUrl(cert.serialNumber),
        downloadPath: `/student/certificates/${cert.id}/download`,
        adminDownloadPath: `/admin/certificates/${cert.id}/download`,
        publicDownloadPath: `/certificates/verify/${encodedSerial}/download`,
        verifyPath: `/certificates/verify/${encodedSerial}`,
        verifyUrl: `/verify-certificate/${encodedSerial}`,
    };
}
export async function assertStudentOwnsCertificate(studentId, certificateId) {
    const cert = await prisma.certificate.findFirst({
        where: { id: certificateId, studentId },
        select: { id: true },
    });
    if (!cert)
        throw new AppError('Certificate not found.', 404);
}
//# sourceMappingURL=certificate-pdf.service.js.map