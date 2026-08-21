import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
export const LESSON_RESOURCE_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'lesson-resources');
if (!fs.existsSync(LESSON_RESOURCE_UPLOAD_DIR)) {
    fs.mkdirSync(LESSON_RESOURCE_UPLOAD_DIR, { recursive: true });
}
const EXTENSION_BY_MIME = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
};
const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx']);
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, LESSON_RESOURCE_UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const fromMime = EXTENSION_BY_MIME[file.mimetype];
        const fromName = path.extname(file.originalname || '').toLowerCase();
        const extension = fromMime || (ALLOWED_EXT.has(fromName) ? fromName : '.bin');
        cb(null, `lesson-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    },
});
export const lessonResourceUpload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (EXTENSION_BY_MIME[file.mimetype] || ALLOWED_EXT.has(ext)) {
            cb(null, true);
            return;
        }
        cb(new Error('Unsupported file type. Use PDF, DOC, DOCX, PPT, or PPTX.'));
    },
});
//# sourceMappingURL=lessonResourceUpload.middleware.js.map