import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import crypto from 'crypto';
import {
  certificateLinkMeta,
  getCertificatePdfBufferById,
  persistCertificatePdf,
} from '../../shared/certificate-pdf.service.js';

export const issueManualCertificate = async (adminId: string, data: any) => {
  const { studentId, title, courseId, examId } = data;

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError('Student not found', 404);

  let course = null;
  if (courseId) {
    course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Course not found', 404);
  }

  const serialNumber = `EP-ADM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const certificate = await prisma.certificate.create({
    data: {
      serialNumber,
      studentId,
      courseId,
      examId,
      issuedById: adminId,
      title,
    },
    include: {
      student: { select: { fullName: true } },
      course: { select: { title: true } },
    },
  });

  const pdfBuffer = await persistCertificatePdf(certificate);
  return { buffer: pdfBuffer, filename: `certificate-${serialNumber}.pdf` };
};

export const downloadCertificate = async (certificateId: string) => {
  const cert = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: { id: true, serialNumber: true },
  });
  if (!cert) throw new AppError('Certificate not found', 404);

  const buffer = await getCertificatePdfBufferById(cert.id);
  return { buffer, filename: `certificate-${cert.serialNumber}.pdf` };
};

export const getAllCertificates = async (options: any) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const { studentId, courseId } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (courseId) where.courseId = courseId;

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { fullName: true, email: true } },
        course: { select: { title: true } }
      },
      orderBy: { issuedAt: 'desc' }
    }),
    prisma.certificate.count({ where })
  ]);

  return {
    certificates: certificates.map((cert) => ({
      ...cert,
      links: certificateLinkMeta(cert),
    })),
    total,
    page,
    limit,
  };
};

export const getCertificateById = async (id: string) => {
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, fullName: true, avatar: true, email: true } },
      course: { select: { id: true, title: true } },
      issuedBy: { select: { id: true, fullName: true } }
    }
  });
  if (!cert) throw new AppError('Certificate not found', 404);
  return { ...cert, links: certificateLinkMeta(cert) };
};

