import { LearningResourceType } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
function inferResourceMeta(input) {
    const name = `${input.originalName || ''} ${input.fileUrl || ''}`.toLowerCase();
    const mime = (input.mimeType || '').toLowerCase();
    const hinted = (input.fileType || '').toUpperCase();
    let resourceType = input.resourceType || LearningResourceType.DOCUMENT;
    let fileType = hinted || 'FILE';
    if (mime.includes('pdf') || name.endsWith('.pdf') || hinted === 'PDF') {
        resourceType = LearningResourceType.PDF;
        fileType = 'PDF';
    }
    else if (mime.includes('presentation') ||
        mime.includes('powerpoint') ||
        name.endsWith('.ppt') ||
        name.endsWith('.pptx') ||
        hinted === 'PPT' ||
        hinted === 'PPTX') {
        resourceType = LearningResourceType.PPT;
        fileType = name.endsWith('.ppt') || hinted === 'PPT' ? 'PPT' : 'PPTX';
    }
    else if (mime.includes('word') ||
        mime.includes('msword') ||
        name.endsWith('.doc') ||
        name.endsWith('.docx') ||
        hinted === 'DOC' ||
        hinted === 'DOCX' ||
        hinted === 'DOCUMENT') {
        resourceType = LearningResourceType.DOCUMENT;
        fileType = name.endsWith('.doc') || hinted === 'DOC' ? 'DOC' : 'DOCX';
    }
    else if (mime.startsWith('image/') || hinted === 'IMAGE') {
        resourceType = LearningResourceType.IMAGE;
        fileType = 'IMAGE';
    }
    return { resourceType, fileType };
}
export const createResource = async (lessonId, data) => {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson)
        throw new AppError('Lesson not found', 404);
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
function decodeUploadFilename(name) {
    if (!name)
        return '';
    const raw = String(name);
    // Multer/busboy often exposes non-ASCII filenames as Latin-1 mojibake of UTF-8 bytes.
    if (/[À-ÿ]/.test(raw) && !/[\u0600-\u06FF]/.test(raw)) {
        try {
            const fixed = Buffer.from(raw, 'latin1').toString('utf8');
            if (fixed && !fixed.includes('\uFFFD'))
                return fixed;
        }
        catch {
            // keep raw
        }
    }
    return raw;
}
export const createResourceFromUpload = async (lessonId, file, title) => {
    if (!file)
        throw new AppError('A file is required', 400);
    const fileUrl = `/uploads/lesson-resources/${file.filename}`;
    const originalName = decodeUploadFilename(file.originalname);
    const explicitTitle = typeof title === 'string' ? decodeUploadFilename(title).trim() : '';
    const displayTitle = (explicitTitle || originalName || 'Lesson file').trim() || 'Lesson file';
    const meta = inferResourceMeta({
        fileUrl,
        mimeType: file.mimetype,
        originalName,
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
export const listLessonResources = async (lessonId) => {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson)
        throw new AppError('Lesson not found', 404);
    const resources = await prisma.lessonResource.findMany({
        where: { lessonId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    // Repair previously saved mojibake titles (UTF-8 read as Latin-1).
    const repairs = resources
        .map((r) => {
        const fixed = decodeUploadFilename(r.title);
        if (fixed && fixed !== r.title && /[\u0600-\u06FF]/.test(fixed)) {
            return { id: r.id, title: fixed };
        }
        return null;
    })
        .filter(Boolean);
    if (repairs.length) {
        await Promise.all(repairs.map((r) => prisma.lessonResource.update({ where: { id: r.id }, data: { title: r.title } })));
        return resources.map((r) => {
            const hit = repairs.find((x) => x.id === r.id);
            return hit ? { ...r, title: hit.title } : r;
        });
    }
    return resources;
};
export const deleteResource = async (resourceId) => {
    const resource = await prisma.lessonResource.findUnique({ where: { id: resourceId } });
    if (!resource)
        throw new AppError('Resource not found', 404);
    await prisma.lessonResource.delete({ where: { id: resourceId } });
    return null;
};
export const getAllResources = async (options) => {
    const { page = 1, limit = 10, lessonId } = options;
    const skip = (page - 1) * limit;
    const where = {};
    if (lessonId)
        where.lessonId = lessonId;
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
export const getResourceById = async (id) => {
    const resource = await prisma.lessonResource.findUnique({
        where: { id },
        include: {
            lesson: { include: { section: { include: { unit: { include: { course: true } } } } } },
        }
    });
    if (!resource)
        throw new AppError('Resource not found', 404);
    return resource;
};
//# sourceMappingURL=admin-resource.service.js.map