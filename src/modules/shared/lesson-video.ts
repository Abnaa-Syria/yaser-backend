/** True when the lesson has a playable video source (VdoCipher and/or legacy URL). */
export function lessonHasVideo(lesson: {
  videoUrl?: string | null;
  vdoCipherVideoId?: string | null;
}): boolean {
  return Boolean(lesson.vdoCipherVideoId?.trim() || lesson.videoUrl?.trim());
}

export type LegacyVideoProvider = 'youtube' | 'vimeo' | 'direct';

/** Extract an 11-char YouTube video id from common URL shapes. */
export function extractYouTubeId(rawUrl: string): string | null {
  return (
    String(rawUrl || '')
      .trim()
      .match(
        /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
      )?.[1] || null
  );
}

/** Privacy-enhanced embed URL (youtube-nocookie + reduced branding params). */
export function buildYouTubeEmbedUrl(videoId: string, options: { autoplay?: boolean } = {}): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    playsinline: '1',
    fs: '1',
    cc_load_policy: '0',
    // Prefer no related videos / channel chrome where still respected.
    color: 'white',
  });
  if (options.autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '0');
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function youtubePosterUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Convert watch/share URLs into iframe-safe embed URLs for legacy lesson videoUrl. */
export function resolveVideoEmbedUrl(rawUrl: string): {
  embedUrl: string;
  provider: LegacyVideoProvider;
  videoId?: string;
  posterUrl?: string;
} {
  const url = rawUrl.trim();
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return {
      embedUrl: buildYouTubeEmbedUrl(ytId),
      provider: 'youtube',
      videoId: ytId,
      posterUrl: youtubePosterUrl(ytId),
    };
  }
  const vimeoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vimeoId) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoId}`, provider: 'vimeo' };
  }
  return { embedUrl: url, provider: 'direct' };
}
