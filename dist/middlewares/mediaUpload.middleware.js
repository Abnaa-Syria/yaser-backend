import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MEDIA_UPLOAD_DIR = path.join(__dirname, '../../uploads/media');
fs.mkdirSync(MEDIA_UPLOAD_DIR, { recursive: true });
const EXTENSION_BY_MIME = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, MEDIA_UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const extension = EXTENSION_BY_MIME[file.mimetype] || '';
        cb(null, `media-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    },
});
export const mediaUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (EXTENSION_BY_MIME[file.mimetype]) {
            cb(null, true);
            return;
        }
        cb(new Error('Unsupported image type. Use JPEG, PNG, WEBP, or GIF.'));
    },
});
//# sourceMappingURL=mediaUpload.middleware.js.map