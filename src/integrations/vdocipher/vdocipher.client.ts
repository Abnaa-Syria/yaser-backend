import { AppError } from '../../utils/AppError.js';
import { isVdoCipherConfigured, VDOCIPHER_CONFIG } from '../../config/vdocipher.config.js';

export type VdoCipherOtpResult = {
  otp: string;
  playbackInfo: string;
};

export type VdoCipherVideoRow = {
  id: string;
  title: string;
  description?: string | null;
  length: number;
  status: string;
  uploadTime: number | null;
  posterUrl: string | null;
  tags: string[];
};

export type VdoCipherVideoList = {
  count: number;
  page: number;
  limit: number;
  rows: VdoCipherVideoRow[];
};

type GenerateOtpOptions = {
  videoId: string;
  ttlSeconds?: number;
  /** Shown as on-video watermark text (e.g. student email). */
  watermarkText?: string | null;
};

type ListVideosOptions = {
  page?: number;
  limit?: number;
  q?: string;
};

function requireConfigured() {
  if (!isVdoCipherConfigured()) {
    throw new AppError('VdoCipher is not configured on the server.', 503);
  }
}

async function vdoFetch(path: string, init?: RequestInit): Promise<Response> {
  requireConfigured();
  const url = `${VDOCIPHER_CONFIG.baseUrl}${path}`;
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Apisecret ${VDOCIPHER_CONFIG.apiSecret}`,
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new AppError('Failed to reach VdoCipher API.', 502);
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const errBody = (await response.json()) as { message?: string };
    return errBody?.message ? `: ${errBody.message}` : '';
  } catch {
    return '';
  }
}

/**
 * Request a short-lived playback OTP from VdoCipher.
 * Must only be called from the backend after access checks.
 */
export async function generateVdoCipherOtp(options: GenerateOtpOptions): Promise<VdoCipherOtpResult> {
  const videoId = options.videoId.trim();
  if (!videoId) {
    throw new AppError('VdoCipher video ID is missing.', 400);
  }

  const ttl = options.ttlSeconds ?? VDOCIPHER_CONFIG.otpTtlSeconds;
  const body: Record<string, unknown> = { ttl };

  const watermark = options.watermarkText?.trim();
  if (watermark) {
    body.annotate = JSON.stringify([
      {
        type: 'rtext',
        text: watermark,
        alpha: '0.55',
        color: '0xFFFFFF',
        size: '15',
        interval: '5000',
      },
    ]);
  }

  const response = await vdoFetch(`/videos/${encodeURIComponent(videoId)}/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new AppError(`VdoCipher OTP request failed${detail}`, response.status >= 500 ? 502 : 400);
  }

  const data = (await response.json()) as { otp?: string; playbackInfo?: string };
  if (!data?.otp || !data?.playbackInfo) {
    throw new AppError('Invalid response from VdoCipher OTP API.', 502);
  }

  return { otp: data.otp, playbackInfo: data.playbackInfo };
}

/**
 * List videos from the VdoCipher library (admin/instructor use only — rate-limited upstream).
 */
export async function listVdoCipherVideos(options: ListVideosOptions = {}): Promise<VdoCipherVideoList> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(40, Math.max(1, options.limit ?? 20));
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (options.q?.trim()) params.set('q', options.q.trim());

  const response = await vdoFetch(`/videos?${params.toString()}`, { method: 'GET' });

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new AppError(`VdoCipher video list failed${detail}`, response.status >= 500 ? 502 : 400);
  }

  const data = (await response.json()) as {
    count?: number;
    rows?: Array<{
      id?: string;
      title?: string;
      description?: string | null;
      length?: number;
      status?: string;
      upload_time?: number;
      posters?: Array<{ posterUrl?: string }>;
      tags?: string[];
    }>;
  };

  const rows = (data.rows || [])
    .filter((row) => row?.id)
    .map((row) => ({
      id: String(row.id),
      title: row.title || row.id || 'Untitled',
      description: row.description ?? null,
      length: Number(row.length) || 0,
      status: row.status || 'unknown',
      uploadTime: typeof row.upload_time === 'number' ? row.upload_time : null,
      posterUrl: row.posters?.[0]?.posterUrl || null,
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    }));

  return {
    count: Number(data.count) || rows.length,
    page,
    limit,
    rows,
  };
}
