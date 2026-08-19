import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { requireCourseAccess } from '../../../utils/subscriptionValidator.js';
import { generateVdoCipherOtp } from '../../../integrations/vdocipher/vdocipher.client.js';
import { lessonHasVideo, resolveVideoEmbedUrl } from '../../shared/lesson-video.js';
/**
 * Issue playback credentials for a lesson after verifying course purchase.
 * Prefers VdoCipher OTP when configured on the lesson; falls back to legacy videoUrl.
 */
export const getLessonPlayback = async (studentId, lessonId, studentEmail) => {
    const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, deletedAt: null },
        select: {
            id: true,
            videoUrl: true,
            vdoCipherVideoId: true,
            section: {
                select: {
                    unit: { select: { courseId: true } },
                },
            },
        },
    });
    if (!lesson) {
        throw new AppError('Lesson not found.', 404);
    }
    if (!lessonHasVideo(lesson)) {
        throw new AppError('No video available for this lesson.', 404);
    }
    await requireCourseAccess(studentId, lesson.section.unit.courseId);
    const vdoId = lesson.vdoCipherVideoId?.trim();
    if (vdoId) {
        const { otp, playbackInfo } = await generateVdoCipherOtp({
            videoId: vdoId,
            watermarkText: studentEmail || studentId,
        });
        const embedUrl = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;
        return {
            provider: 'vdocipher',
            lessonId: lesson.id,
            otp,
            playbackInfo,
            embedUrl,
        };
    }
    const url = lesson.videoUrl.trim();
    const { embedUrl } = resolveVideoEmbedUrl(url);
    return {
        provider: 'url',
        lessonId: lesson.id,
        url,
        embedUrl,
    };
};
//# sourceMappingURL=student-playback.service.js.map