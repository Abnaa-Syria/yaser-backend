import { APP_BRAND } from '../config/brand.config.js';

const LAYOUT_MARKER = 'data-yu-email-layout="1"';

/** Escape text for safe HTML insertion. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Wrap email body HTML in a branded, mobile-friendly layout.
 * Skips wrapping if the body already includes the platform layout marker.
 */
export function wrapEmailHtml(bodyHtml: string, options?: { preheader?: string }): string {
  const inner = String(bodyHtml || '').trim();
  if (!inner) return '';
  if (inner.includes(LAYOUT_MARKER)) return inner;

  const brand = escapeHtml(APP_BRAND.name);
  const siteUrl = escapeHtml(APP_BRAND.siteUrl);
  const contact = escapeHtml(APP_BRAND.contactEmail);
  const year = new Date().getFullYear();
  const preheader = escapeHtml(options?.preheader || '');

  return `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${brand}</title>
</head>
<body ${LAYOUT_MARKER} style="margin:0;padding:0;background:#F1F5F9;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#0F172A;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#0A1628 0%,#153577 55%,#1B4FBF 100%);padding:22px 28px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(219,234,254,0.85);font-weight:700;">${brand}</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#ffffff;">Medical learning platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;line-height:1.7;color:#334155;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 26px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;">
                © ${year} ${brand}. All rights reserved.<br/>
                <a href="${siteUrl}" style="color:#1D4ED8;text-decoration:none;">${siteUrl}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${contact}" style="color:#1D4ED8;text-decoration:none;">${contact}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;">
  <a href="${escapeHtml(href)}" style="display:inline-block;background:#1D4ED8;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">
    ${escapeHtml(label)}
  </a>
</p>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 14px;">${escapeHtml(text)}</p>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0F172A;">${escapeHtml(text)}</h1>`;
}
