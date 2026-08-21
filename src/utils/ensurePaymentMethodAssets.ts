import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Ensure default SuperQi QR exists under /uploads for checkout display. */
export function ensureDefaultPaymentMethodAssets() {
  const destDir = path.join(__dirname, '../../uploads/payment-methods');
  const destFile = path.join(destDir, 'iraq-superqi-qr.jpeg');
  const sourceFile = path.join(__dirname, '../../assets/payment-methods/iraq-superqi-qr.jpeg');

  try {
    fs.mkdirSync(destDir, { recursive: true });
    if (!fs.existsSync(destFile) && fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
    }
  } catch {
    // Non-fatal — admin can upload QR from settings.
  }
}
