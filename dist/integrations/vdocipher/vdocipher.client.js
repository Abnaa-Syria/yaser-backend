import { AppError } from '../../utils/AppError.js';
import { isVdoCipherConfigured, VDOCIPHER_CONFIG } from '../../config/vdocipher.config.js';
function requireConfigured() {
    if (!isVdoCipherConfigured()) {
        throw new AppError('VdoCipher is not configured on the server.', 503);
    }
}
async function vdoFetch(path, init) {
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
    }
    catch {
        throw new AppError('Failed to reach VdoCipher API.', 502);
    }
}
async function readErrorDetail(response) {
    try {
        const errBody = (await response.json());
        return errBody?.message ? `: ${errBody.message}` : '';
    }
    catch {
        return '';
    }
}
/**
 * Request a short-lived playback OTP from VdoCipher.
 * Must only be called from the backend after access checks.
 */
export async function generateVdoCipherOtp(options) {
    const videoId = options.videoId.trim();
    if (!videoId) {
        throw new AppError('VdoCipher video ID is missing.', 400);
    }
    const ttl = options.ttlSeconds ?? VDOCIPHER_CONFIG.otpTtlSeconds;
    const body = { ttl };
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
    const data = (await response.json());
    if (!data?.otp || !data?.playbackInfo) {
        throw new AppError('Invalid response from VdoCipher OTP API.', 502);
    }
    return { otp: data.otp, playbackInfo: data.playbackInfo };
}
/**
 * List videos from the VdoCipher library (admin/instructor use only — rate-limited upstream).
 */
export async function listVdoCipherVideos(options = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(40, Math.max(1, options.limit ?? 20));
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });
    if (options.q?.trim())
        params.set('q', options.q.trim());
    const response = await vdoFetch(`/videos?${params.toString()}`, { method: 'GET' });
    if (!response.ok) {
        const detail = await readErrorDetail(response);
        throw new AppError(`VdoCipher video list failed${detail}`, response.status >= 500 ? 502 : 400);
    }
    const data = (await response.json());
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
//# sourceMappingURL=vdocipher.client.js.map