import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const HOMEWORK_UPLOAD_DIR = path.join(__dirname, '../../uploads/homework');
if (!fs.existsSync(HOMEWORK_UPLOAD_DIR)) {
    fs.mkdirSync(HOMEWORK_UPLOAD_DIR, { recursive: true });
}
const ALLOWED_MIME = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const EXTENSION_BY_MIME = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, HOMEWORK_UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const extension = EXTENSION_BY_MIME[file.mimetype] || '';
        cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${extension}`);
    },
});
export const homeworkSubmitUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Unsupported file type. Use PDF, image, or audio files.'));
    },
});
//# sourceMappingURL=homeworkUpload.middleware.js.map