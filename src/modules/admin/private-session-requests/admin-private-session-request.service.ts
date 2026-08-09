import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import type { PrivateSessionRequestStatus } from '@prisma/client';

export const listPrivateSessionRequests = async (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  const status = query.status ? (String(query.status) as PrivateSessionRequestStatus) : undefined;

  const where = status ? { status } : {};

  const [rows, total] = await Promise.all([
    prisma.privateSessionRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: { select: { id: true, fullName: true, email: true } },
        student: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.privateSessionRequest.count({ where }),
  ]);

  return { requests: rows, total, page, limit };
};

export const updatePrivateSessionRequest = async (
  id: string,
  data: { status?: PrivateSessionRequestStatus; adminNotes?: string | null }
) => {
  const row = await prisma.privateSessionRequest.findUnique({ where: { id } });
  if (!row) throw new AppError('Request not found', 404);

  return prisma.privateSessionRequest.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
    },
    include: {
      instructor: { select: { id: true, fullName: true, email: true } },
      student: { select: { id: true, fullName: true, email: true } },
    },
  });
};
