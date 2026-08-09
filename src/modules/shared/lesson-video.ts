/** True when the lesson has a playable video source (VdoCipher and/or legacy URL). */
export function lessonHasVideo(lesson: {
  videoUrl?: string | null;
  vdoCipherVideoId?: string | null;
}): boolean {
  return Boolean(lesson.vdoCipherVideoId?.trim() || lesson.videoUrl?.trim());
}
