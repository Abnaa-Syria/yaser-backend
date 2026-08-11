/** True when the lesson has a playable video source (VdoCipher and/or legacy URL). */
export function lessonHasVideo(lesson) {
    return Boolean(lesson.vdoCipherVideoId?.trim() || lesson.videoUrl?.trim());
}
//# sourceMappingURL=lesson-video.js.map