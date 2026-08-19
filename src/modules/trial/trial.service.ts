import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { generateToken } from '../../utils/security/jwt.js';
import { generateVdoCipherOtp } from '../../integrations/vdocipher/vdocipher.client.js';
import { lessonHasVideo, resolveVideoEmbedUrl } from '../shared/lesson-video.js';
import {
  isCourseInActiveTrial,
  listActiveTrialCourses,
  loadTrialSettings,
} from './trial-settings.js';

function publicTrialCourseCard(row: Awaited<ReturnType<typeof listActiveTrialCourses>>[number]) {
  const c = row.course;
  return {
    id: c.id,
    title: c.title,
    titleAr: c.titleAr,
    slug: c.slug,
    shortDescription: c.shortDescription,
    shortDescriptionAr: c.shortDescriptionAr,
    thumbnail: c.thumbnail,
    coverImage: c.coverImage,
    displayOrder: row.displayOrder,
  };
}

function assertFingerprint(fingerprint?: string | null) {
  const fp = String(fingerprint || '').trim();
  if (fp.length < 8) {
    throw new AppError('Device fingerprint is required to start or continue the free trial.', 400);
  }
  return fp.slice(0, 191);
}

function sessionStatus(session: { expiresAt: Date; revokedAt: Date | null }) {
  if (session.revokedAt) return 'REVOKED' as const;
  if (session.expiresAt.getTime() <= Date.now()) return 'EXPIRED' as const;
  return 'ACTIVE' as const;
}

function issueTrialToken(session: { id: string; expiresAt: Date }) {
  const expiresInSeconds = Math.max(60, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
  return generateToken({
    payload: {
      userId: `trial:${session.id}`,
      type: 'trial',
      trialId: session.id,
    },
    expiresIn: expiresInSeconds,
  });
}

function remainingPayload(session: { id: string; startedAt: Date; expiresAt: Date; revokedAt: Date | null }) {
  const status = sessionStatus(session);
  const now = Date.now();
  const msLeft = session.expiresAt.getTime() - now;
  const expired = status !== 'ACTIVE';
  return {
    trialId: session.id,
    startedAt: session.startedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    status,
    revoked: Boolean(session.revokedAt),
    expired,
    remainingMs: expired ? 0 : Math.max(0, msLeft),
    remainingDays: expired ? 0 : Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
  };
}

export async function getPublicTrialConfig() {
  const settings = await loadTrialSettings();
  if (!settings.enabled) {
    return {
      enabled: false,
      popupEnabled: false,
      durationDays: settings.durationDays,
      dismissDays: settings.dismissDays,
      title: settings.title,
      titleAr: settings.titleAr,
      subtitle: settings.subtitle,
      subtitleAr: settings.subtitleAr,
      ctaLabel: settings.ctaLabel,
      ctaLabelAr: settings.ctaLabelAr,
      courses: [] as ReturnType<typeof publicTrialCourseCard>[],
    };
  }

  const trialCourses = await listActiveTrialCourses();
  return {
    enabled: true,
    popupEnabled: settings.popupEnabled,
    durationDays: settings.durationDays,
    dismissDays: settings.dismissDays,
    title: settings.title,
    titleAr: settings.titleAr,
    subtitle: settings.subtitle,
    subtitleAr: settings.subtitleAr,
    ctaLabel: settings.ctaLabel,
    ctaLabelAr: settings.ctaLabelAr,
    courses: trialCourses.map(publicTrialCourseCard),
  };
}

export async function startTrialSession(input: {
  fingerprint?: string;
  userAgent?: string;
  deviceName?: string;
  os?: string;
  ipAddress?: string;
}) {
  const settings = await loadTrialSettings();
  if (!settings.enabled) {
    throw new AppError('Free trial is currently disabled.', 403);
  }

  const trialCourses = await listActiveTrialCourses();
  if (trialCourses.length === 0) {
    throw new AppError('No trial courses are available yet.', 403);
  }

  const fingerprint = assertFingerprint(input.fingerprint);
  const existing = await prisma.trialSession.findUnique({ where: { fingerprint } });

  if (existing) {
    if (existing.revokedAt) {
      throw new AppError('This device trial was stopped by an administrator.', 403);
    }
    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new AppError('Free trial on this device has already ended. Create an account to continue.', 403);
    }

    const updated = await prisma.trialSession.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        userAgent: input.userAgent?.slice(0, 2000) || existing.userAgent,
        deviceName: input.deviceName?.slice(0, 120) || existing.deviceName,
        os: input.os?.slice(0, 80) || existing.os,
        ipAddress: input.ipAddress?.slice(0, 64) || existing.ipAddress,
      },
    });

    return {
      accessToken: issueTrialToken(updated),
      resumed: true,
      ...remainingPayload(updated),
      durationDays: settings.durationDays,
      courses: trialCourses.map(publicTrialCourseCard),
    };
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + settings.durationDays * 24 * 60 * 60 * 1000);

  const session = await prisma.trialSession.create({
    data: {
      fingerprint,
      userAgent: input.userAgent?.slice(0, 2000) || null,
      deviceName: input.deviceName?.slice(0, 120) || null,
      os: input.os?.slice(0, 80) || null,
      ipAddress: input.ipAddress?.slice(0, 64) || null,
      startedAt,
      expiresAt,
      lastSeenAt: startedAt,
    },
  });

  return {
    accessToken: issueTrialToken(session),
    resumed: false,
    ...remainingPayload(session),
    durationDays: settings.durationDays,
    courses: trialCourses.map(publicTrialCourseCard),
  };
}

export async function getTrialMe(trialId: string, fingerprint?: string) {
  const session = await prisma.trialSession.findUnique({ where: { id: trialId } });
  if (!session) throw new AppError('Trial session not found.', 404);

  if (fingerprint) {
    const fp = assertFingerprint(fingerprint);
    if (session.fingerprint !== fp) {
      throw new AppError('Trial session does not match this device.', 403);
    }
  }

  if (session.revokedAt) {
    throw new AppError('This device trial was stopped by an administrator.', 403);
  }

  // lastSeenAt is already touched in protectTrial — avoid a second concurrent
  // UPDATE (MariaDB 1020: "Record has changed since last read").

  const settings = await loadTrialSettings();
  const trialCourses = await listActiveTrialCourses();
  const payload = remainingPayload(session);

  return {
    ...payload,
    durationDays: settings.durationDays,
    fingerprintBound: true,
    courses: trialCourses.map(publicTrialCourseCard),
  };
}

export async function getTrialCourses() {
  const trialCourses = await listActiveTrialCourses();
  return trialCourses.map(publicTrialCourseCard);
}

export async function requireTrialCourseAccess(courseId: string) {
  const settings = await loadTrialSettings();
  if (!settings.enabled) {
    throw new AppError('Free trial is currently disabled.', 403);
  }
  const ok = await isCourseInActiveTrial(courseId);
  if (!ok) {
    throw new AppError('This course is not included in the free trial.', 403);
  }
}

export async function getTrialCourseContent(courseId: string) {
  await requireTrialCourseAccess(courseId);

  return prisma.unit.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      order: true,
      sections: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              content: true,
              order: true,
              videoUrl: true,
              vdoCipherVideoId: true,
              isPreview: true,
              resources: {
                where: { isVisible: true },
                orderBy: { createdAt: 'asc' },
                select: {
                  id: true,
                  title: true,
                  fileUrl: true,
                  externalUrl: true,
                  fileType: true,
                  mimeType: true,
                  fileSizeBytes: true,
                  isDownloadable: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/** Flatten video lessons across all active trial courses (recordings library). */
export async function getTrialRecordings() {
  const trialCourses = await listActiveTrialCourses();
  const courseIds = trialCourses.map((c) => c.courseId);
  if (!courseIds.length) return [];

  const lessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      OR: [{ videoUrl: { not: null } }, { vdoCipherVideoId: { not: null } }],
      section: {
        deletedAt: null,
        unit: { courseId: { in: courseIds } },
      },
    },
    orderBy: [{ order: 'asc' }],
    select: {
      id: true,
      title: true,
      videoUrl: true,
      vdoCipherVideoId: true,
      order: true,
      section: {
        select: {
          title: true,
          unit: {
            select: {
              title: true,
              courseId: true,
              course: { select: { id: true, title: true, titleAr: true, thumbnail: true } },
            },
          },
        },
      },
    },
    take: 500,
  });

  return lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    order: lesson.order,
    hasVideo: Boolean(lesson.vdoCipherVideoId || lesson.videoUrl),
    unitTitle: lesson.section.unit.title,
    sectionTitle: lesson.section.title,
    courseId: lesson.section.unit.courseId,
    courseTitle: lesson.section.unit.course.title,
    courseTitleAr: lesson.section.unit.course.titleAr,
    thumbnail: lesson.section.unit.course.thumbnail,
    learnPath: `/trial/courses/${lesson.section.unit.courseId}/learn?lesson=${lesson.id}`,
  }));
}

export async function getTrialLessonPlayback(lessonId: string, trialId: string) {
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

  if (!lesson) throw new AppError('Lesson not found.', 404);
  if (!lessonHasVideo(lesson)) throw new AppError('No video available for this lesson.', 404);

  await requireTrialCourseAccess(lesson.section.unit.courseId);

  const vdoId = lesson.vdoCipherVideoId?.trim();
  if (vdoId) {
    const { otp, playbackInfo } = await generateVdoCipherOtp({
      videoId: vdoId,
      watermarkText: `trial:${trialId.slice(0, 8)}`,
    });
    const embedUrl = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;
    return {
      provider: 'vdocipher' as const,
      lessonId: lesson.id,
      otp,
      playbackInfo,
      embedUrl,
    };
  }

  const url = lesson.videoUrl!.trim();
  const { embedUrl } = resolveVideoEmbedUrl(url);
  return {
    provider: 'url' as const,
    lessonId: lesson.id,
    url,
    embedUrl,
  };
}

export { sessionStatus };
