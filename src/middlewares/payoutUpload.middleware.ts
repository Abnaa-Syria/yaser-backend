import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PAYOUT_UPLOAD_DIR = path.join(__dirname, '../../uploads/payouts');

if (!fs.existsSync(PAYOUT_UPLOAD_DIR)) {
  fs.mkdirSync(PAYOUT_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PAYOUT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = EXTENSION_BY_MIME[file.mimetype] || '';
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${extension}`);
  },
});

export const payoutReceiptUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported file type. Use PDF, JPEG, or PNG files.') as any);
  },
});
