import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function settingToString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function fileToDataUri(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buf = fs.readFileSync(filePath);
    if (!buf.length) return null;
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.jpg' || ext === '.jpeg'
              ? 'image/jpeg'
              : null;
    if (!mime) return null;
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

function resolveLocalUploadPath(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith('/uploads/')) return null;
  // Never allow path traversal outside uploads/
  const relative = trimmed.replace(/^\/+/, '');
  if (relative.includes('..')) return null;
  return path.join(process.cwd(), relative);
}

/** Platform logo as a data URI for Puppeteer PDF rendering. */
export async function resolveCertificateLogoBase64(): Promise<string> {
  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: 'LOGO_PRIMARY_URL' },
      select: { value: true },
    });
    const logoUrl = settingToString(row?.value);
    if (logoUrl) {
      const uploadPath = resolveLocalUploadPath(logoUrl);
      if (uploadPath) {
        const fromUpload = fileToDataUri(uploadPath);
        if (fromUpload) return fromUpload;
      }
    }
  } catch {
    // Fall through to bundled assets when DB is unavailable.
  }

  const candidates = [
    path.join(process.cwd(), 'assets', 'certificate-logo.svg'),
    path.join(process.cwd(), 'assets', 'platform-logo.svg'),
    path.join(__dirname, '../../assets/certificate-logo.svg'),
    path.join(__dirname, '../../assets/platform-logo.svg'),
    path.join(process.cwd(), '..', 'alienparts.online', 'dist', 'assets', 'brand', 'logo-primary.svg'),
    path.join(process.cwd(), '..', 'frontend', 'public', 'assets', 'brand', 'logo-primary.svg'),
    path.join(process.cwd(), 'frontend', 'public', 'assets', 'brand', 'logo-primary.svg'),
  ];

  for (const filePath of candidates) {
    const data = fileToDataUri(filePath);
    if (data) return data;
  }

  return '';
}
