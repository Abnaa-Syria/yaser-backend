import type { Request } from 'express';

/** Best-effort client IP + UA for trial device registry. */
export function getDeviceMetadata(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : undefined;

  const userAgent = req.get('user-agent') || undefined;
  const fingerprintHeader = req.get('x-device-fingerprint') || undefined;

  return {
    fingerprint: fingerprintHeader?.trim() || undefined,
    userAgent,
    deviceName: undefined as string | undefined,
    os: undefined as string | undefined,
    ipAddress: forwardedIp || req.ip || req.socket?.remoteAddress || undefined,
  };
}
