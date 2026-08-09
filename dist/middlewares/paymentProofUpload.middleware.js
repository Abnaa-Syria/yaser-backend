import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
export const PAYMENT_PROOF_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'payment-proofs');
if (!fs.existsSync(PAYMENT_PROOF_UPLOAD_DIR)) {
    fs.mkdirSync(PAYMENT_PROOF_UPLOAD_DIR, { recursive: true });
}
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PAYMENT_PROOF_UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeExtension = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(extension) ? extension : '';
        cb(null, `${Date.now()}-${cryptoRandom()}${safeExtension}`);
    },
});
export const paymentProofUpload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Unsupported payment proof type. Use PDF, JPG, PNG, or WEBP.'));
    },
});
function cryptoRandom() {
    return crypto.randomBytes(12).toString('hex');
}
//# sourceMappingURL=paymentProofUpload.middleware.js.map