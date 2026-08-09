import fs from 'fs';
import path from 'path';

const LOGO_RELATIVE_PATH = path.join('public', 'assets', 'brand', 'logo-primary.svg');

/** Platform logo as a data URI for Puppeteer PDF rendering. */
export function resolveCertificateLogoBase64(): string {
  const candidates = [
    path.join(process.cwd(), 'assets', 'platform-logo.svg'),
    path.join(process.cwd(), '..', 'frontend', LOGO_RELATIVE_PATH),
    path.join(process.cwd(), 'frontend', LOGO_RELATIVE_PATH),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  }

  return '';
}
