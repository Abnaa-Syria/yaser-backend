import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
import { hasCourseAccess } from '../../../utils/subscriptionValidator.js';
const DEFAULT_INTERVALS = {
    EASY: 30,
    MEDIUM: 7,
    HARD: 3,
};
const INTERVAL_KEYS = {
    EASY: 'FLASHCARD_INTERVAL_EASY_DAYS',
    MEDIUM: 'FLASHCARD_INTERVAL_MEDIUM_DAYS',
    HARD: 'FLASHCARD_INTERVAL_HARD_DAYS',
};
function parseDays(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0)
        return Math.floor(value);
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        if (Number.isFinite(n) && n >= 0)
            return Math.floor(n);
    }
    return fallback;
}
export async function getFlashcardIntervals() {
    const keys = Object.values(INTERVAL_KEYS);
    const rows = await prisma.platformSetting.findMany({ where: { key: { in: keys } } });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
        EASY: parseDays(map.get(INTERVAL_KEYS.EASY), DEFAULT_INTERVALS.EASY),
        MEDIUM: parseDays(map.get(INTERVAL_KEYS.MEDIUM), DEFAULT_INTERVALS.MEDIUM),
        HARD: parseDays(map.get(INTERVAL_KEYS.HARD), DEFAULT_INTERVALS.HARD),
    };
}
function addDays(from, days) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}
async function allowedCourseIds(studentId, courseId) {
    const now = new Date();
    const accessWhere = {
        studentId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
    if (courseId)
        accessWhere.courseId = courseId;
    const purchases = await prisma.coursePurchase.findMany({
        where: accessWhere,
        select: { courseId: true },
    });
    return purchases.map((p) => p.courseId);
}
const platformCardSelect = {
    id: true,
    lessonId: true,
    front: true,
    frontAr: true,
    back: true,
    backAr: true,
    explanation: true,
    explanationAr: true,
    displayOrder: true,
    lesson: {
        select: {
            id: true,
            title: true,
            titleAr: true,
            section: {
                select: {
                    id: true,
                    title: true,
                    unit: { select: { id: true, title: true, titleAr: true, courseId: true } },
                },
            },
        },
    },
};
export async function listMyFlashcards(studentId, query) {
    const courseIds = await allowedCourseIds(studentId, query.courseId);
    if (courseIds.length === 0)
        return [];
    const where = {
        status: 'PUBLISHED',
        lesson: {
            deletedAt: null,
            status: 'PUBLISHED',
            section: {
                deletedAt: null,
                unit: {
                    courseId: { in: courseIds },
                    status: 'PUBLISHED',
                },
            },
        },
    };
    if (query.lessonId)
        where.lessonId = query.lessonId;
    if (query.unitId || query.courseId) {
        where.lesson = {
            ...where.lesson,
            section: {
                deletedAt: null,
                unit: {
                    ...(query.unitId ? { id: query.unitId } : {}),
                    courseId: { in: courseIds },
                    status: 'PUBLISHED',
                },
            },
        };
    }
    const cards = await prisma.flashcard.findMany({
        where,
        orderBy: [{ lessonId: 'asc' }, { displayOrder: 'asc' }],
        select: platformCardSelect,
    });
    if (cards.length === 0)
        return [];
    const progressRows = await prisma.flashcardProgress.findMany({
        where: { studentId, flashcardId: { in: cards.map((c) => c.id) } },
        select: { flashcardId: true, difficulty: true, nextDueAt: true, lastReviewedAt: true },
    });
    const progressByCard = new Map(progressRows.map((p) => [p.flashcardId, p]));
    const now = new Date();
    const dueOnly = query.dueOnly !== false;
    return cards
        .map((card) => {
        const progress = progressByCard.get(card.id);
        return {
            ...card,
            nextDueAt: progress?.nextDueAt ?? null,
            lastDifficulty: progress?.difficulty ?? null,
            lastReviewedAt: progress?.lastReviewedAt ?? null,
            isDue: !progress || progress.nextDueAt <= now,
        };
    })
        .filter((card) => (dueOnly ? card.isDue : true));
}
export async function reviewPlatformFlashcard(studentId, flashcardId, difficulty) {
    const card = await prisma.flashcard.findFirst({
        where: {
            id: flashcardId,
            status: 'PUBLISHED',
            lesson: {
                deletedAt: null,
                status: 'PUBLISHED',
                section: { deletedAt: null, unit: { status: 'PUBLISHED' } },
            },
        },
        select: {
            id: true,
            lesson: { select: { section: { select: { unit: { select: { courseId: true } } } } } },
        },
    });
    if (!card)
        throw new AppError('Flashcard not found.', 404);
    const courseId = card.lesson.section.unit.courseId;
    const allowed = await hasCourseAccess(studentId, courseId);
    if (!allowed)
        throw new AppError('You do not have access to this flashcard.', 403);
    const intervals = await getFlashcardIntervals();
    const now = new Date();
    const nextDueAt = addDays(now, intervals[difficulty]);
    const progress = await prisma.flashcardProgress.upsert({
        where: { studentId_flashcardId: { studentId, flashcardId } },
        create: {
            studentId,
            flashcardId,
            difficulty,
            nextDueAt,
            lastReviewedAt: now,
        },
        update: {
            difficulty,
            nextDueAt,
            lastReviewedAt: now,
        },
    });
    return {
        flashcardId,
        difficulty: progress.difficulty,
        nextDueAt: progress.nextDueAt,
        lastReviewedAt: progress.lastReviewedAt,
        intervalDays: intervals[difficulty],
    };
}
async function assertOptionalLinkedAccess(studentId, data) {
    const courseId = await resolveLinkedCourseId(data);
    if (!courseId)
        return;
    const allowed = await hasCourseAccess(studentId, courseId);
    if (!allowed)
        throw new AppError('You cannot link flashcards to a course you do not currently access.', 403);
}
async function resolveLinkedCourseId(data) {
    if (data.courseId)
        return data.courseId;
    if (data.unitId) {
        const unit = await prisma.unit.findUnique({ where: { id: data.unitId }, select: { courseId: true } });
        return unit?.courseId || null;
    }
    if (data.lessonId) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: data.lessonId },
            select: { section: { select: { unit: { select: { courseId: true } } } } },
        });
        return lesson?.section.unit.courseId || null;
    }
    return null;
}
const personalInclude = {
    course: { select: { id: true, title: true, titleAr: true } },
    unit: { select: { id: true, title: true, titleAr: true, courseId: true } },
    lesson: { select: { id: true, title: true, titleAr: true } },
    progress: {
        select: { difficulty: true, nextDueAt: true, lastReviewedAt: true },
    },
};
function mapPersonalCard(card) {
    const progress = card.progress[0] || null;
    const now = new Date();
    return {
        id: card.id,
        front: card.front,
        frontAr: card.frontAr,
        back: card.back,
        backAr: card.backAr,
        explanation: card.explanation,
        explanationAr: card.explanationAr,
        courseId: card.courseId,
        unitId: card.unitId,
        lessonId: card.lessonId,
        displayOrder: card.displayOrder,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        course: card.course,
        unit: card.unit,
        lesson: card.lesson,
        nextDueAt: progress?.nextDueAt ?? null,
        lastDifficulty: progress?.difficulty ?? null,
        lastReviewedAt: progress?.lastReviewedAt ?? null,
        isDue: !progress || progress.nextDueAt <= now,
    };
}
export async function listPersonalFlashcards(studentId, query = {}) {
    const where = { studentId };
    if (query.courseId)
        where.courseId = query.courseId;
    if (query.unitId)
        where.unitId = query.unitId;
    if (query.lessonId)
        where.lessonId = query.lessonId;
    const cards = await prisma.studentFlashcard.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: personalInclude,
    });
    const dueOnly = query.dueOnly === true;
    return cards.map(mapPersonalCard).filter((card) => (dueOnly ? card.isDue : true));
}
export async function createPersonalFlashcard(studentId, data) {
    const front = data.front?.trim();
    const back = data.back?.trim();
    if (!front || !back)
        throw new AppError('Front and back are required.', 400);
    await assertOptionalLinkedAccess(studentId, data);
    const created = await prisma.studentFlashcard.create({
        data: {
            studentId,
            front,
            frontAr: data.frontAr?.trim() || null,
            back,
            backAr: data.backAr?.trim() || null,
            explanation: data.explanation?.trim() || null,
            explanationAr: data.explanationAr?.trim() || null,
            courseId: data.courseId || null,
            unitId: data.unitId || null,
            lessonId: data.lessonId || null,
            displayOrder: data.displayOrder ?? 0,
        },
        include: personalInclude,
    });
    return mapPersonalCard(created);
}
export async function updatePersonalFlashcard(studentId, id, data) {
    const existing = await prisma.studentFlashcard.findFirst({ where: { id, studentId } });
    if (!existing)
        throw new AppError('Flashcard not found.', 404);
    await assertOptionalLinkedAccess(studentId, data);
    const updated = await prisma.studentFlashcard.update({
        where: { id },
        data: {
            ...(data.front !== undefined ? { front: data.front.trim() } : {}),
            ...(data.frontAr !== undefined ? { frontAr: data.frontAr?.trim() || null } : {}),
            ...(data.back !== undefined ? { back: data.back.trim() } : {}),
            ...(data.backAr !== undefined ? { backAr: data.backAr?.trim() || null } : {}),
            ...(data.explanation !== undefined ? { explanation: data.explanation?.trim() || null } : {}),
            ...(data.explanationAr !== undefined ? { explanationAr: data.explanationAr?.trim() || null } : {}),
            ...(data.courseId !== undefined ? { courseId: data.courseId || null } : {}),
            ...(data.unitId !== undefined ? { unitId: data.unitId || null } : {}),
            ...(data.lessonId !== undefined ? { lessonId: data.lessonId || null } : {}),
            ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        },
        include: personalInclude,
    });
    return mapPersonalCard(updated);
}
export async function deletePersonalFlashcard(studentId, id) {
    const existing = await prisma.studentFlashcard.findFirst({ where: { id, studentId } });
    if (!existing)
        throw new AppError('Flashcard not found.', 404);
    await prisma.studentFlashcard.delete({ where: { id } });
    return { id, deleted: true };
}
export async function reviewPersonalFlashcard(studentId, studentFlashcardId, difficulty) {
    const card = await prisma.studentFlashcard.findFirst({
        where: { id: studentFlashcardId, studentId },
        select: { id: true },
    });
    if (!card)
        throw new AppError('Flashcard not found.', 404);
    const intervals = await getFlashcardIntervals();
    const now = new Date();
    const nextDueAt = addDays(now, intervals[difficulty]);
    const progress = await prisma.studentFlashcardProgress.upsert({
        where: { studentId_studentFlashcardId: { studentId, studentFlashcardId } },
        create: {
            studentId,
            studentFlashcardId,
            difficulty,
            nextDueAt,
            lastReviewedAt: now,
        },
        update: {
            difficulty,
            nextDueAt,
            lastReviewedAt: now,
        },
    });
    return {
        flashcardId: studentFlashcardId,
        difficulty: progress.difficulty,
        nextDueAt: progress.nextDueAt,
        lastReviewedAt: progress.lastReviewedAt,
        intervalDays: intervals[difficulty],
    };
}
//# sourceMappingURL=student-flashcard.service.js.map