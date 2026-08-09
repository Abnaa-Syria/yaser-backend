import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

export const CV_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'instructor-cvs');

if (!fs.existsSync(CV_UPLOAD_DIR)) {
  fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CV_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'].includes(extension)
      ? extension
      : '.pdf';
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${safeExtension}`);
  },
});

export const instructorCvUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported CV type. Use PDF, DOC, DOCX, JPG, or PNG.') as any);
  },
});
