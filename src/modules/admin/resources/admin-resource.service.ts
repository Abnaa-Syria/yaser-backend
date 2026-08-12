import { LearningResourceType } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';

type ResourceInput = {
  title: string;
  fileUrl: string;
  fileType?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  resourceType?: LearningResourceType;
  isDownloadable?: boolean;
  isVisible?: boolean;
};

function inferResourceMeta(input: {
  fileUrl?: string;
  mimeType?: string;
  fileType?: string;
  originalName?: string;
  resourceType?: LearningResourceType;
}) {
  const name = `${input.originalName || ''} ${input.fileUrl || ''}`.toLowerCase();
  const mime = (input.mimeType || '').toLowerCase();
  const hinted = (input.fileType || '').toUpperCase();

  let resourceType: LearningResourceType = input.resourceType || LearningResourceType.DOCUMENT;
  let fileType = hinted || 'FILE';

  if (mime.includes('pdf') || name.endsWith('.pdf') || hinted === 'PDF') {
    resourceType = LearningResourceType.PDF;
    fileType = 'PDF';
  } else if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx') ||
    hinted === 'PPT' ||
    hinted === 'PPTX'
  ) {
    resourceType = LearningResourceType.PPT;
    fileType = name.endsWith('.ppt') || hinted === 'PPT' ? 'PPT' : 'PPTX';
  } else if (
    mime.includes('word') ||
    mime.includes('msword') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    hinted === 'DOC' ||
    hinted === 'DOCX' ||
    hinted === 'DOCUMENT'
  ) {
    resourceType = LearningResourceType.DOCUMENT;
    fileType = name.endsWith('.doc') || hinted === 'DOC' ? 'DOC' : 'DOCX';
  } else if (mime.startsWith('image/') || hinted === 'IMAGE') {
    resourceType = LearningResourceType.IMAGE;
    fileType = 'IMAGE';
  }

  return { resourceType, fileType };
}

export const createResource = async (lessonId: string, data: ResourceInput) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError('Lesson not found', 404);

  const meta = inferResourceMeta(data);

  return prisma.lessonResource.create({
    data: {
      lessonId,
      title: data.title.trim(),
      fileUrl: data.fileUrl,
      fileType: meta.fileType,
      mimeType: data.mimeType || null,
      fileSizeBytes: data.fileSizeBytes ?? null,
      resourceType: meta.resourceType,
      isDownloadable: data.isDownloadable !== false,
      isVisible: data.isVisible !== false,
    },
  });
};

export const createResourceFromUpload = async (
  lessonId: string,
  file: Express.Multer.File,
  title?: string
) => {
  if (!file) throw new AppError('A file is required', 400);

  const fileUrl = `/uploads/lesson-resources/${file.filename}`;
  const displayTitle = (title || file.originalname || 'Lesson file').trim() || 'Lesson file';
  const meta = inferResourceMeta({
    fileUrl,
    mimeType: file.mimetype,
    originalName: file.originalname,
  });

  return createResource(lessonId, {
    title: displayTitle,
    fileUrl,
    fileType: meta.fileType,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    resourceType: meta.resourceType,
  });
};

export const listLessonResources = async (lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) throw new AppError('Lesson not found', 404);

  return prisma.lessonResource.findMany({
    where: { lessonId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
};

export const deleteResource = async (resourceId: string) => {
  const resource = await prisma.lessonResource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new AppError('Resource not found', 404);

  await prisma.lessonResource.delete({ where: { id: resourceId } });
  return null;
};

export const getAllResources = async (options: any) => {
  const { page = 1, limit = 10, lessonId } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (lessonId) where.lessonId = lessonId;

  const [resources, total] = await Promise.all([
    prisma.lessonResource.findMany({
      where,
      skip,
      take: limit,
      include: {
        lesson: {
          select: {
            title: true,
            section: { select: { title: true, unit: { select: { title: true, course: { select: { title: true } } } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.lessonResource.count({ where })
  ]);

  return { resources, total, page, limit };
};

export const getResourceById = async (id: string) => {
  const resource = await prisma.lessonResource.findUnique({
    where: { id },
    include: {
      lesson: { include: { section: { include: { unit: { include: { course: true } } } } } },
    }
  });
  if (!resource) throw new AppError('Resource not found', 404);
  return resource;
};

