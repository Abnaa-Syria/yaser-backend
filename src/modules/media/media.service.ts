import fs from 'fs';
import path from 'path';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { MEDIA_UPLOAD_DIR } from '../../middlewares/mediaUpload.middleware.js';

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function listMediaAssets({ page = 1, limit = 24, search }: ListParams) {
  const take = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const q = typeof search === 'string' ? search.trim() : '';

  const where = q
    ? {
        OR: [
          { originalName: { contains: q } },
          { filename: { contains: q } },
          { url: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        uploadedBy: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.mediaAsset.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: Math.max(Number(page) || 1, 1),
      limit: take,
      total,
      totalPages: Math.max(1, Math.ceil(total / take)),
    },
  };
}

export async function createMediaAssetFromUpload(file: Express.Multer.File, uploadedById?: string) {
  if (!file) throw new AppError('An image file is required', 400);

  const url = `/uploads/media/${file.filename}`;
  return prisma.mediaAsset.create({
    data: {
      url,
      filename: file.filename,
      originalName: file.originalname || file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      folder: 'media',
      uploadedById: uploadedById || null,
    },
  });
}

export async function deleteMediaAsset(id: string, actor: { id: string; roleName?: string | null }) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new AppError('Media asset not found', 404);

  const role = String(actor.roleName || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isOwner = asset.uploadedById && asset.uploadedById === actor.id;
  if (!isAdmin && !isOwner) {
    throw new AppError('You can only delete media you uploaded', 403);
  }

  const diskPath = path.join(MEDIA_UPLOAD_DIR, asset.filename);
  try {
    if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
  } catch {
    // Continue deleting DB row even if file already missing
  }

  await prisma.mediaAsset.delete({ where: { id } });
  return { id };
}
