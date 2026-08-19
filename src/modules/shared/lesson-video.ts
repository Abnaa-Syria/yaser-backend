/** True when the lesson has a playable video source (VdoCipher and/or legacy URL). */
export function lessonHasVideo(lesson: {
  videoUrl?: string | null;
  vdoCipherVideoId?: string | null;
}): boolean {
  return Boolean(lesson.vdoCipherVideoId?.trim() || lesson.videoUrl?.trim());
}

export type LegacyVideoProvider = 'youtube' | 'vimeo' | 'direct';

/** Convert watch/share URLs into iframe-safe embed URLs for legacy lesson videoUrl. */
export function resolveVideoEmbedUrl(rawUrl: string): { embedUrl: string; provider: LegacyVideoProvider } {
  const url = rawUrl.trim();
  const ytId = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )?.[1];
  if (ytId) {
    return { embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`, provider: 'youtube' };
  }
  const vimeoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vimeoId) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoId}`, provider: 'vimeo' };
  }
  return { embedUrl: url, provider: 'direct' };
}
