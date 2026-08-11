import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
export const XP = {
    LESSON: 15,
    EXAM_BASE: 10,
    EXAM_SCORE_MAX: 40,
    STUDY_PLAN: 8,
    CERTIFICATE: 100,
    CHALLENGE: 50,
    STREAK_7: 25,
    STREAK_30: 75,
    FLASHCARD_SESSION: 5,
    FLASHCARD_DAILY_CAP: 20,
};
export function levelFromXp(totalXp) {
    return Math.floor(Math.sqrt(Math.max(0, totalXp) / 100)) + 1;
}
export function xpToNextLevel(totalXp) {
    const level = levelFromXp(totalXp);
    const currentFloor = (level - 1) ** 2 * 100;
    const nextFloor = level ** 2 * 100;
    const span = Math.max(1, nextFloor - currentFloor);
    const into = Math.max(0, totalXp - currentFloor);
    return {
        level,
        current: totalXp,
        next: nextFloor,
        progress: Math.min(100, Math.round((into / span) * 100)),
    };
}
/** Calendar date string YYYY-MM-DD in UTC (stable for streak). */
export function utcDateString(d = new Date()) {
    return d.toISOString().slice(0, 10);
}
function parseDateOnly(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}
function daysBetween(a, b) {
    const ms = Date.parse(`${b}T00:00:00.000Z`) - Date.parse(`${a}T00:00:00.000Z`);
    return Math.round(ms / (24 * 60 * 60 * 1000));
}
async function ensureProfile(userId, tx = prisma) {
    return tx.studentGameProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
    });
}
function applyStreak(profile, today) {
    const last = parseDateOnly(profile.lastActiveDate);
    let currentStreak = profile.currentStreak;
    let longestStreak = profile.longestStreak;
    if (!last) {
        currentStreak = 1;
    }
    else if (last === today) {
        // same day — keep streak
    }
    else if (daysBetween(last, today) === 1) {
        currentStreak += 1;
    }
    else {
        currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    return { currentStreak, longestStreak, lastActiveDate: new Date(`${today}T00:00:00.000Z`) };
}
async function evaluateBadges(userId, tx) {
    const [defs, owned, lessonCount, certCount, profile, challengeDone, bestExam] = await Promise.all([
        tx.badgeDefinition.findMany({ where: { isActive: true } }),
        tx.studentBadge.findMany({ where: { userId }, select: { badgeId: true } }),
        tx.lessonProgress.count({ where: { studentId: userId, isCompleted: true } }),
        tx.certificate.count({ where: { studentId: userId } }),
        tx.studentGameProfile.findUnique({ where: { userId } }),
        tx.weeklyChallengeProgress.count({ where: { userId, completedAt: { not: null } } }),
        tx.examSubmission.findFirst({
            where: { studentId: userId, submittedAt: { not: null }, totalScore: { not: null } },
            orderBy: { totalScore: 'desc' },
            include: { exam: { select: { totalPoints: true, passingScore: true } } },
        }),
    ]);
    const ownedIds = new Set(owned.map((o) => o.badgeId));
    const unlocked = [];
    for (const def of defs) {
        if (ownedIds.has(def.id))
            continue;
        const rule = (def.rule || {});
        let ok = false;
        if (rule.type === 'FIRST_LESSON')
            ok = lessonCount >= 1;
        if (rule.type === 'LESSONS_COMPLETED')
            ok = lessonCount >= (rule.count || 0);
        if (rule.type === 'STREAK')
            ok = (profile?.currentStreak || 0) >= (rule.days || 0) || (profile?.longestStreak || 0) >= (rule.days || 0);
        if (rule.type === 'CERTIFICATES')
            ok = certCount >= (rule.count || 0);
        if (rule.type === 'TOTAL_XP')
            ok = (profile?.totalXp || 0) >= (rule.amount || 0);
        if (rule.type === 'CHALLENGE_COMPLETED')
            ok = challengeDone >= (rule.count || 0);
        if (rule.type === 'EXAM_SCORE' && bestExam?.exam) {
            const total = Math.max(1, bestExam.exam.totalPoints || 1);
            const pct = Math.round(((bestExam.totalScore || 0) / total) * 100);
            ok = pct >= (rule.minPercent || 90);
        }
        if (ok) {
            await tx.studentBadge.create({ data: { userId, badgeId: def.id } });
            unlocked.push({
                id: def.id,
                key: def.key,
                titleEn: def.titleEn,
                titleAr: def.titleAr,
                xpReward: def.xpReward || 0,
            });
        }
    }
    return unlocked;
}
async function bumpWeeklyChallenge(userId, event, tx) {
    const challenge = await ensureCurrentWeeklyChallenge(tx);
    if (!challenge)
        return { completed: false };
    let delta = 0;
    if (challenge.goalType === 'COMPLETE_LESSONS' && event.sourceType === 'LESSON')
        delta = 1;
    if (challenge.goalType === 'PASS_EXAMS' && event.sourceType === 'EXAM' && event.meta?.passed === true)
        delta = 1;
    if (challenge.goalType === 'EARN_XP')
        delta = Math.max(0, event.amount);
    if (delta <= 0)
        return { completed: false };
    const row = await tx.weeklyChallengeProgress.upsert({
        where: { challengeId_userId: { challengeId: challenge.id, userId } },
        create: { challengeId: challenge.id, userId, progress: delta },
        update: { progress: { increment: delta } },
    });
    const nextProgress = row.progress;
    if (!row.completedAt && nextProgress >= challenge.goalTarget) {
        await tx.weeklyChallengeProgress.update({
            where: { id: row.id },
            data: { completedAt: new Date(), progress: Math.max(nextProgress, challenge.goalTarget) },
        });
        return { completed: true, challengeId: challenge.id, rewardXp: challenge.rewardXp };
    }
    return { completed: false };
}
export async function ensureCurrentWeeklyChallenge(tx = prisma) {
    const now = new Date();
    const day = now.getUTCDay(); // 0 Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset));
    const weekStart = new Date(`${monday.toISOString().slice(0, 10)}T00:00:00.000Z`);
    const existing = await tx.weeklyChallenge.findFirst({
        where: { weekStart, isActive: true },
        orderBy: { createdAt: 'desc' },
    });
    if (existing)
        return existing;
    return tx.weeklyChallenge.create({
        data: {
            weekStart,
            titleEn: 'Complete 5 lessons this week',
            titleAr: 'أكمل 5 دروس هذا الأسبوع',
            descriptionEn: 'Stay consistent — finish five lessons before the week ends.',
            descriptionAr: 'حافظ على الانتظام — أنهِ خمسة دروس قبل نهاية الأسبوع.',
            goalType: 'COMPLETE_LESSONS',
            goalTarget: 5,
            rewardXp: XP.CHALLENGE,
            isActive: true,
        },
    });
}
export async function awardXp(input) {
    const amount = Math.max(0, Math.floor(input.amount));
    if (!input.userId || amount <= 0 || !input.sourceId) {
        return { awarded: false, amount: 0, totalXp: 0, level: 1, currentStreak: 0, newBadges: [] };
    }
    // Only enrolled students earn real XP (excludes admin/instructor and trial sessions).
    const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { role: { select: { name: true } } },
    });
    if (!user || user.role?.name !== 'STUDENT') {
        return { awarded: false, amount: 0, totalXp: 0, level: 1, currentStreak: 0, newBadges: [] };
    }
    const today = utcDateString();
    try {
        const result = await prisma.$transaction(async (tx) => {
            await ensureProfile(input.userId, tx);
            try {
                await tx.xpLedger.create({
                    data: {
                        userId: input.userId,
                        amount,
                        reason: input.reason,
                        sourceType: input.sourceType,
                        sourceId: input.sourceId,
                        meta: (input.meta || {}),
                    },
                });
            }
            catch (err) {
                // Unique constraint = already awarded
                if (err?.code === 'P2002') {
                    const profile = await tx.studentGameProfile.findUnique({ where: { userId: input.userId } });
                    return {
                        awarded: false,
                        amount: 0,
                        totalXp: profile?.totalXp || 0,
                        level: profile?.level || 1,
                        currentStreak: profile?.currentStreak || 0,
                        newBadges: [],
                    };
                }
                throw err;
            }
            const profile = await tx.studentGameProfile.findUniqueOrThrow({ where: { userId: input.userId } });
            const streak = applyStreak(profile, today);
            const totalXp = profile.totalXp + amount;
            const level = levelFromXp(totalXp);
            await tx.studentGameProfile.update({
                where: { userId: input.userId },
                data: {
                    totalXp,
                    level,
                    currentStreak: streak.currentStreak,
                    longestStreak: streak.longestStreak,
                    lastActiveDate: streak.lastActiveDate,
                },
            });
            // Streak milestone bonuses (once)
            if (streak.currentStreak === 7) {
                try {
                    await tx.xpLedger.create({
                        data: {
                            userId: input.userId,
                            amount: XP.STREAK_7,
                            reason: '7-day study streak',
                            sourceType: 'STREAK',
                            sourceId: `streak-7-${today}`,
                            meta: { days: 7 },
                        },
                    });
                    await tx.studentGameProfile.update({
                        where: { userId: input.userId },
                        data: { totalXp: { increment: XP.STREAK_7 }, level: levelFromXp(totalXp + XP.STREAK_7) },
                    });
                }
                catch {
                    /* already granted */
                }
            }
            if (streak.currentStreak === 30) {
                try {
                    await tx.xpLedger.create({
                        data: {
                            userId: input.userId,
                            amount: XP.STREAK_30,
                            reason: '30-day study streak',
                            sourceType: 'STREAK',
                            sourceId: `streak-30-${today}`,
                            meta: { days: 30 },
                        },
                    });
                    await tx.studentGameProfile.update({
                        where: { userId: input.userId },
                        data: { totalXp: { increment: XP.STREAK_30 } },
                    });
                }
                catch {
                    /* already granted */
                }
            }
            const challenge = await bumpWeeklyChallenge(input.userId, { sourceType: input.sourceType, amount, meta: input.meta }, tx);
            let challengeCompleted = false;
            if (challenge.completed && challenge.challengeId) {
                challengeCompleted = true;
                try {
                    await tx.xpLedger.create({
                        data: {
                            userId: input.userId,
                            amount: challenge.rewardXp || XP.CHALLENGE,
                            reason: 'Weekly challenge completed',
                            sourceType: 'CHALLENGE',
                            sourceId: `challenge-${challenge.challengeId}`,
                            meta: { challengeId: challenge.challengeId },
                        },
                    });
                    await tx.studentGameProfile.update({
                        where: { userId: input.userId },
                        data: { totalXp: { increment: challenge.rewardXp || XP.CHALLENGE } },
                    });
                }
                catch {
                    /* already granted */
                }
            }
            const newBadges = await evaluateBadges(input.userId, tx);
            for (const b of newBadges) {
                if (b.xpReward > 0) {
                    try {
                        await tx.xpLedger.create({
                            data: {
                                userId: input.userId,
                                amount: b.xpReward,
                                reason: `Badge: ${b.key}`,
                                sourceType: 'MANUAL',
                                sourceId: `badge-${b.key}`,
                                meta: { badgeKey: b.key },
                            },
                        });
                        await tx.studentGameProfile.update({
                            where: { userId: input.userId },
                            data: { totalXp: { increment: b.xpReward } },
                        });
                    }
                    catch {
                        /* skip */
                    }
                }
            }
            const finalProfile = await tx.studentGameProfile.findUniqueOrThrow({ where: { userId: input.userId } });
            return {
                awarded: true,
                amount,
                totalXp: finalProfile.totalXp,
                level: levelFromXp(finalProfile.totalXp),
                currentStreak: finalProfile.currentStreak,
                newBadges: newBadges.map(({ key, titleEn, titleAr }) => ({ key, titleEn, titleAr })),
                challengeCompleted,
            };
        });
        return result;
    }
    catch (error) {
        console.error('[gamification] awardXp failed', error);
        return { awarded: false, amount: 0, totalXp: 0, level: 1, currentStreak: 0, newBadges: [] };
    }
}
export async function awardLessonXp(userId, lessonId, courseId) {
    return awardXp({
        userId,
        amount: XP.LESSON,
        reason: 'Lesson completed',
        sourceType: 'LESSON',
        sourceId: lessonId,
        meta: { courseId },
    });
}
export async function awardExamXp(userId, submissionId, opts) {
    const total = Math.max(1, opts.totalPoints || opts.passingScore || 1);
    const pct = Math.min(100, Math.max(0, Math.round((opts.score / total) * 100)));
    const bonus = Math.round((pct / 100) * XP.EXAM_SCORE_MAX);
    const amount = XP.EXAM_BASE + bonus;
    return awardXp({
        userId,
        amount,
        reason: `Exam submitted (${pct}%)`,
        sourceType: 'EXAM',
        sourceId: submissionId,
        meta: { courseId: opts.courseId, passed: opts.passed, percent: pct },
    });
}
export async function awardStudyPlanItemXp(userId, itemId) {
    return awardXp({
        userId,
        amount: XP.STUDY_PLAN,
        reason: 'Study plan item completed',
        sourceType: 'STUDY_PLAN',
        sourceId: itemId,
    });
}
export async function awardCertificateXp(userId, certificateId, courseId) {
    return awardXp({
        userId,
        amount: XP.CERTIFICATE,
        reason: 'Course certificate claimed',
        sourceType: 'CERTIFICATE',
        sourceId: certificateId,
        meta: { courseId },
    });
}
/** Flashcard review session XP with a daily cap (anti-farming). */
export async function awardFlashcardSessionXp(userId, sessionKey) {
    const today = utcDateString();
    const dayStart = new Date(`${today}T00:00:00.000Z`);
    const dayEnd = new Date(`${today}T23:59:59.999Z`);
    const earnedToday = await prisma.xpLedger.aggregate({
        where: {
            userId,
            sourceType: 'MANUAL',
            sourceId: { startsWith: 'flashcard-' },
            createdAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
    });
    const already = earnedToday._sum.amount || 0;
    if (already >= XP.FLASHCARD_DAILY_CAP) {
        return { awarded: false, amount: 0, totalXp: 0, level: 1, currentStreak: 0, newBadges: [] };
    }
    const amount = Math.min(XP.FLASHCARD_SESSION, XP.FLASHCARD_DAILY_CAP - already);
    return awardXp({
        userId,
        amount,
        reason: 'Flashcard review session',
        sourceType: 'MANUAL',
        sourceId: `flashcard-${today}-${sessionKey}`,
        meta: { kind: 'FLASHCARD' },
    });
}
export function publicDisplayName(fullName, optOut) {
    if (optOut)
        return 'Anonymous';
    const parts = String(fullName || 'Student')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0)
        return 'Student';
    if (parts.length === 1)
        return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
export async function getMyGamification(userId) {
    await ensureProfile(userId);
    await ensureCurrentWeeklyChallenge();
    const [profile, badges, recentXp, challenge] = await Promise.all([
        prisma.studentGameProfile.findUniqueOrThrow({
            where: { userId },
            include: { user: { select: { fullName: true } } },
        }),
        prisma.studentBadge.findMany({
            where: { userId },
            include: { badge: true },
            orderBy: { earnedAt: 'desc' },
            take: 50,
        }),
        prisma.xpLedger.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        }),
        prisma.weeklyChallenge.findFirst({
            where: { isActive: true },
            orderBy: { weekStart: 'desc' },
            include: {
                progress: { where: { userId }, take: 1 },
            },
        }),
    ]);
    const weekStart = startOfUtcWeek();
    const weekXpAgg = await prisma.xpLedger.aggregate({
        where: { userId, createdAt: { gte: weekStart } },
        _sum: { amount: true },
    });
    const weekXp = weekXpAgg._sum.amount || 0;
    const globalRank = (await prisma.studentGameProfile.count({
        where: {
            AND: [
                { totalXp: { gt: 0 } },
                { totalXp: { gt: profile.totalXp } },
                { user: { role: { name: 'STUDENT' } } },
            ],
        },
    })) + (profile.totalXp > 0 ? 1 : 0);
    const levelInfo = xpToNextLevel(profile.totalXp);
    const challengeProgress = challenge?.progress?.[0];
    const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUnlocks = badges
        .filter((b) => b.earnedAt >= recentCutoff)
        .map((b) => ({
        key: b.badge.key,
        titleEn: b.badge.titleEn,
        titleAr: b.badge.titleAr,
        icon: b.badge.icon,
        earnedAt: b.earnedAt,
    }));
    return {
        profile: {
            totalXp: profile.totalXp,
            level: levelInfo.level,
            levelProgress: levelInfo.progress,
            xpToNext: Math.max(0, levelInfo.next - profile.totalXp),
            currentStreak: profile.currentStreak,
            longestStreak: profile.longestStreak,
            lastActiveDate: profile.lastActiveDate,
            displayNameOptOut: profile.displayNameOptOut,
            displayName: publicDisplayName(profile.user.fullName, profile.displayNameOptOut),
        },
        weekXp,
        globalRank: profile.totalXp > 0 ? globalRank : null,
        badges: badges.map((b) => ({
            key: b.badge.key,
            titleEn: b.badge.titleEn,
            titleAr: b.badge.titleAr,
            descriptionEn: b.badge.descriptionEn,
            descriptionAr: b.badge.descriptionAr,
            icon: b.badge.icon,
            earnedAt: b.earnedAt,
        })),
        recentUnlocks,
        recentXp,
        challenge: challenge
            ? {
                id: challenge.id,
                titleEn: challenge.titleEn,
                titleAr: challenge.titleAr,
                descriptionEn: challenge.descriptionEn,
                descriptionAr: challenge.descriptionAr,
                goalType: challenge.goalType,
                goalTarget: challenge.goalTarget,
                rewardXp: challenge.rewardXp,
                weekStart: challenge.weekStart,
                progress: challengeProgress?.progress || 0,
                completedAt: challengeProgress?.completedAt || null,
            }
            : null,
    };
}
function startOfUtcWeek(d = new Date()) {
    const day = d.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + mondayOffset));
}
export async function getLeaderboard(opts) {
    const limit = Math.min(50, Math.max(1, opts.limit || 50));
    const weekStart = startOfUtcWeek();
    if (opts.scope === 'course' && !opts.courseId) {
        throw new AppError('courseId is required for course leaderboard', 400);
    }
    if (opts.period === 'all' && opts.scope === 'global') {
        const rows = await prisma.studentGameProfile.findMany({
            where: { totalXp: { gt: 0 }, user: { role: { name: 'STUDENT' } } },
            orderBy: { totalXp: 'desc' },
            take: limit,
            include: { user: { select: { id: true, fullName: true } } },
        });
        const my = await prisma.studentGameProfile.findUnique({
            where: { userId: opts.userId },
            include: { user: { select: { fullName: true } } },
        });
        const myRank = my && my.totalXp > 0
            ? (await prisma.studentGameProfile.count({
                where: {
                    AND: [
                        { totalXp: { gt: 0 } },
                        { totalXp: { gt: my.totalXp } },
                        { user: { role: { name: 'STUDENT' } } },
                    ],
                },
            })) + 1
            : null;
        return {
            scope: opts.scope,
            period: opts.period,
            entries: rows.map((r, i) => ({
                rank: i + 1,
                userId: r.userId,
                displayName: publicDisplayName(r.user.fullName, r.displayNameOptOut),
                totalXp: r.totalXp,
                level: r.level,
                currentStreak: r.currentStreak,
                isMe: r.userId === opts.userId,
            })),
            me: my && myRank
                ? {
                    rank: myRank,
                    displayName: publicDisplayName(my.user.fullName, my.displayNameOptOut),
                    totalXp: my.totalXp,
                    level: my.level,
                    currentStreak: my.currentStreak,
                }
                : null,
        };
    }
    // Week and/or course: aggregate from ledger
    const where = {
        ...(opts.period === 'week' ? { createdAt: { gte: weekStart } } : {}),
    };
    let grouped;
    if (opts.scope === 'course' && opts.courseId) {
        const rows = await prisma.xpLedger.findMany({
            where,
            select: { userId: true, amount: true, meta: true },
        });
        const totals = new Map();
        for (const row of rows) {
            const meta = row.meta && typeof row.meta === 'object' ? row.meta : {};
            if (meta.courseId !== opts.courseId)
                continue;
            totals.set(row.userId, (totals.get(row.userId) || 0) + row.amount);
        }
        grouped = [...totals.entries()]
            .map(([userId, amount]) => ({ userId, _sum: { amount } }))
            .sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
            .slice(0, limit);
    }
    else {
        // Avoid Prisma groupBy orderBy typing quirks — aggregate in memory for week board.
        const rows = await prisma.xpLedger.findMany({
            where,
            select: { userId: true, amount: true },
        });
        const totals = new Map();
        for (const row of rows) {
            totals.set(row.userId, (totals.get(row.userId) || 0) + row.amount);
        }
        grouped = [...totals.entries()]
            .map(([userId, amount]) => ({ userId, _sum: { amount } }))
            .sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
            .slice(0, limit);
    }
    const userIds = grouped.map((g) => g.userId);
    const profiles = await prisma.studentGameProfile.findMany({
        where: { userId: { in: userIds } },
        include: { user: { select: { fullName: true } } },
    });
    const byId = new Map(profiles.map((p) => [p.userId, p]));
    const entries = grouped.map((g, i) => {
        const p = byId.get(g.userId);
        return {
            rank: i + 1,
            userId: g.userId,
            displayName: publicDisplayName(p?.user.fullName, p?.displayNameOptOut || false),
            totalXp: g._sum.amount || 0,
            level: p?.level || levelFromXp(g._sum.amount || 0),
            currentStreak: p?.currentStreak || 0,
            isMe: g.userId === opts.userId,
        };
    });
    const myXp = await prisma.xpLedger.aggregate({
        where: { ...where, userId: opts.userId },
        _sum: { amount: true },
    });
    const myAmount = myXp._sum.amount || 0;
    let myRank = null;
    if (myAmount > 0) {
        const higher = await prisma.xpLedger.groupBy({
            by: ['userId'],
            where,
            _sum: { amount: true },
        });
        myRank = higher.filter((h) => (h._sum.amount || 0) > myAmount).length + 1;
    }
    const myProfile = await prisma.studentGameProfile.findUnique({
        where: { userId: opts.userId },
        include: { user: { select: { fullName: true } } },
    });
    return {
        scope: opts.scope,
        period: opts.period,
        entries,
        me: myRank && myProfile
            ? {
                rank: myRank,
                displayName: publicDisplayName(myProfile.user.fullName, myProfile.displayNameOptOut),
                totalXp: myAmount,
                level: myProfile.level,
                currentStreak: myProfile.currentStreak,
            }
            : null,
    };
}
export async function listBadgesCatalog(userId) {
    const [defs, owned] = await Promise.all([
        prisma.badgeDefinition.findMany({ where: { isActive: true }, orderBy: { key: 'asc' } }),
        prisma.studentBadge.findMany({ where: { userId } }),
    ]);
    const ownedMap = new Map(owned.map((o) => [o.badgeId, o.earnedAt]));
    return defs.map((d) => ({
        key: d.key,
        titleEn: d.titleEn,
        titleAr: d.titleAr,
        descriptionEn: d.descriptionEn,
        descriptionAr: d.descriptionAr,
        icon: d.icon,
        category: d.category,
        earnedAt: ownedMap.get(d.id) || null,
    }));
}
export async function getCurrentChallenge(userId) {
    const challenge = await ensureCurrentWeeklyChallenge();
    const progress = await prisma.weeklyChallengeProgress.findUnique({
        where: { challengeId_userId: { challengeId: challenge.id, userId } },
    });
    return {
        id: challenge.id,
        titleEn: challenge.titleEn,
        titleAr: challenge.titleAr,
        descriptionEn: challenge.descriptionEn,
        descriptionAr: challenge.descriptionAr,
        goalType: challenge.goalType,
        goalTarget: challenge.goalTarget,
        rewardXp: challenge.rewardXp,
        weekStart: challenge.weekStart,
        progress: progress?.progress || 0,
        completedAt: progress?.completedAt || null,
    };
}
export async function updateDisplayOptOut(userId, optOut) {
    await ensureProfile(userId);
    return prisma.studentGameProfile.update({
        where: { userId },
        data: { displayNameOptOut: !!optOut },
    });
}
export async function adminListChallenges() {
    return prisma.weeklyChallenge.findMany({ orderBy: { weekStart: 'desc' }, take: 52 });
}
export async function adminCreateChallenge(data) {
    return prisma.weeklyChallenge.create({
        data: {
            weekStart: new Date(`${data.weekStart.slice(0, 10)}T00:00:00.000Z`),
            titleEn: data.titleEn,
            titleAr: data.titleAr,
            descriptionEn: data.descriptionEn,
            descriptionAr: data.descriptionAr,
            goalType: data.goalType,
            goalTarget: data.goalTarget,
            rewardXp: data.rewardXp ?? XP.CHALLENGE,
            isActive: data.isActive !== false,
        },
    });
}
export async function adminStats() {
    const [players, topXp, activeWeek] = await Promise.all([
        prisma.studentGameProfile.count({ where: { totalXp: { gt: 0 } } }),
        prisma.studentGameProfile.findFirst({ orderBy: { totalXp: 'desc' }, select: { totalXp: true } }),
        prisma.weeklyChallenge.findFirst({ where: { isActive: true }, orderBy: { weekStart: 'desc' } }),
    ]);
    return { activePlayers: players, topXp: topXp?.totalXp || 0, currentChallenge: activeWeek };
}
export async function seedBadgeDefinitions() {
    const badges = [
        {
            key: 'first_lesson',
            titleEn: 'First Step',
            titleAr: 'الخطوة الأولى',
            descriptionEn: 'Complete your first lesson.',
            descriptionAr: 'أكمل أول درس لك.',
            icon: 'sparkles',
            category: 'learning',
            rule: { type: 'FIRST_LESSON' },
            xpReward: 10,
        },
        {
            key: 'lessons_10',
            titleEn: 'Getting Serious',
            titleAr: 'جدية في التحضير',
            descriptionEn: 'Complete 10 lessons.',
            descriptionAr: 'أكمل 10 دروس.',
            icon: 'book',
            category: 'learning',
            rule: { type: 'LESSONS_COMPLETED', count: 10 },
            xpReward: 25,
        },
        {
            key: 'lessons_100',
            titleEn: 'Century Club',
            titleAr: 'نادي المئة',
            descriptionEn: 'Complete 100 lessons.',
            descriptionAr: 'أكمل 100 درس.',
            icon: 'trophy',
            category: 'learning',
            rule: { type: 'LESSONS_COMPLETED', count: 100 },
            xpReward: 100,
        },
        {
            key: 'week_warrior',
            titleEn: 'Week Warrior',
            titleAr: 'محارب الأسبوع',
            descriptionEn: 'Maintain a 7-day study streak.',
            descriptionAr: 'حافظ على سلسلة دراسة 7 أيام.',
            icon: 'flame',
            category: 'streak',
            rule: { type: 'STREAK', days: 7 },
            xpReward: 0,
        },
        {
            key: 'exam_ace',
            titleEn: 'Exam Ace',
            titleAr: 'أسد الامتحان',
            descriptionEn: 'Score 90% or higher on an exam.',
            descriptionAr: 'احصل على 90% أو أعلى في امتحان.',
            icon: 'target',
            category: 'exams',
            rule: { type: 'EXAM_SCORE', minPercent: 90 },
            xpReward: 40,
        },
        {
            key: 'course_finisher',
            titleEn: 'Course Finisher',
            titleAr: 'مُكمّل الدورة',
            descriptionEn: 'Claim a course certificate.',
            descriptionAr: 'اطلب شهادة إتمام دورة.',
            icon: 'award',
            category: 'milestone',
            rule: { type: 'CERTIFICATES', count: 1 },
            xpReward: 0,
        },
        {
            key: 'challenger',
            titleEn: 'Challenger',
            titleAr: 'المتحدّي',
            descriptionEn: 'Complete your first weekly challenge.',
            descriptionAr: 'أكمل أول تحدٍ أسبوعي.',
            icon: 'flag',
            category: 'challenge',
            rule: { type: 'CHALLENGE_COMPLETED', count: 1 },
            xpReward: 20,
        },
    ];
    for (const b of badges) {
        await prisma.badgeDefinition.upsert({
            where: { key: b.key },
            create: b,
            update: {
                titleEn: b.titleEn,
                titleAr: b.titleAr,
                descriptionEn: b.descriptionEn,
                descriptionAr: b.descriptionAr,
                icon: b.icon,
                category: b.category,
                rule: b.rule,
                xpReward: b.xpReward,
                isActive: true,
            },
        });
    }
    await ensureCurrentWeeklyChallenge();
    return { count: badges.length };
}
//# sourceMappingURL=gamification.service.js.map