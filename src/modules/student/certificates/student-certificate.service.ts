import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';
import crypto from 'crypto';
import {
  certificateLinkMeta,
  getCertificatePdfBufferById,
  persistCertificatePdf,
} from '../../shared/certificate-pdf.service.js';

export const claimCertificate = async (studentId: string, courseId: string) => {
  const purchase = await prisma.coursePurchase.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    include: { student: true, course: true },
  });
  if (!purchase) throw new AppError('You do not own this course', 403);

  const courseLessons = await prisma.lesson.findMany({
    where: { section: { unit: { courseId } } },
    select: { id: true },
  });

  if (courseLessons.length > 0) {
    const lessonIds = courseLessons.map((l) => l.id);
    const completedCount = await prisma.lessonProgress.count({
      where: {
        studentId,
        courseId,
        lessonId: { in: lessonIds },
        isCompleted: true,
      },
    });

    if (completedCount < courseLessons.length) {
      throw new AppError('Course not fully completed yet', 400);
    }
  }

  const existing = await prisma.certificate.findFirst({
    where: { studentId, courseId },
  });
  if (existing) {
    throw new AppError('Certificate already claimed for this course', 400);
  }

  const serialNumber = `EP-${courseId.slice(0, 4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const certificate = await prisma.certificate.create({
    data: {
      serialNumber,
      studentId,
      courseId,
      title: 'Certificate of Completion',
    },
    include: {
      student: { select: { fullName: true } },
      course: { select: { title: true } },
    },
  });

  const pdfBuffer = await persistCertificatePdf(certificate);
  return pdfBuffer;
};

export const downloadMyCertificate = async (studentId: string, certificateId: string) => {
  const cert = await prisma.certificate.findFirst({
    where: { id: certificateId, studentId },
    select: { id: true, serialNumber: true },
  });
  if (!cert) throw new AppError('Certificate not found.', 404);

  const buffer = await getCertificatePdfBufferById(cert.id);
  return { buffer, filename: `certificate-${cert.serialNumber}.pdf` };
};

export const getMyCertificates = async (studentId: string) => {
  const rows = await prisma.certificate.findMany({
    where: { studentId },
    include: { course: { select: { title: true } } },
    orderBy: { issuedAt: 'desc' },
  });

  return rows.map((cert) => ({
    ...cert,
    links: certificateLinkMeta(cert),
  }));
};
