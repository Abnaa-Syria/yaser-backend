import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BRANDING_UPLOAD_DIR = path.join(__dirname, '../../uploads/branding');

fs.mkdirSync(BRANDING_UPLOAD_DIR, { recursive: true });

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BRANDING_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = EXTENSION_BY_MIME[file.mimetype] || '';
    cb(null, `logo-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
  },
});

export const brandingLogoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (EXTENSION_BY_MIME[file.mimetype]) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported logo type. Use PNG, JPEG, or WEBP.') as any);
  },
});
