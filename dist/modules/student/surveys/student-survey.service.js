import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
// ─── Get Pending Survey Questions ──────────────────────────────────────────────
/**
 * Returns all active survey questions grouped by category.
 * Already-answered questions for this (sessionId, studentId) pair are filtered out
 * so the frontend only renders truly unanswered questions.
 */
export const getPendingSurveyQuestions = async (sessionId, studentId) => {
    // Verify the session exists
    const session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true },
    });
    if (!session) {
        throw new AppError('Live session not found.', 404);
    }
    // Fetch IDs of questions the student already answered for this session
    const existingResponses = await prisma.surveyResponse.findMany({
        where: { sessionId, studentId },
        select: { questionId: true },
    });
    const answeredIds = new Set(existingResponses.map((r) => r.questionId));
    // Fetch all active questions
    const questions = await prisma.surveyQuestion.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
        select: {
            id: true,
            textAr: true,
            textEn: true,
            type: true,
            category: true,
            order: true,
        },
    });
    // Filter out already-answered questions
    const pending = questions.filter((q) => !answeredIds.has(q.id));
    // Group by category for convenient frontend rendering
    const grouped = pending.reduce((acc, q) => {
        if (!acc[q.category])
            acc[q.category] = [];
        acc[q.category].push(q);
        return acc;
    }, {});
    return {
        sessionId,
        alreadySubmitted: answeredIds.size > 0 && pending.length === 0,
        totalPending: pending.length,
        questions: grouped,
    };
};
// ─── Submit Survey Responses ───────────────────────────────────────────────────
/**
 * Atomically writes all student answers for a session in a single transaction.
 * Guards against:
 *  1. Non-existent session
 *  2. Duplicate submissions (sessionId + studentId composite already exists)
 *  3. Submitting answers for inactive/non-existent questions
 */
export const submitSurveyResponses = async (sessionId, studentId, answers) => {
    // Guard: verify session exists
    const session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        select: { id: true },
    });
    if (!session) {
        throw new AppError('Live session not found.', 404);
    }
    // Guard: check for any pre-existing response for this (sessionId, studentId) pair
    const existingCount = await prisma.surveyResponse.count({
        where: { sessionId, studentId },
    });
    if (existingCount > 0) {
        throw new AppError('You have already submitted your survey for this session. Duplicate submissions are not allowed.', 409);
    }
    // Validate that all submitted questionIds are active and exist
    const questionIds = answers.map((a) => a.questionId);
    const validQuestions = await prisma.surveyQuestion.findMany({
        where: { id: { in: questionIds }, isActive: true },
        select: { id: true, type: true },
    });
    if (validQuestions.length !== questionIds.length) {
        const validIds = new Set(validQuestions.map((q) => q.id));
        const invalidIds = questionIds.filter((id) => !validIds.has(id));
        throw new AppError(`The following question IDs are invalid or inactive: ${invalidIds.join(', ')}`, 400);
    }
    // Build the question type map for runtime validation
    const questionTypeMap = new Map(validQuestions.map((q) => [q.id, q.type]));
    // Runtime validate each answer against its question type
    for (const answer of answers) {
        const qType = questionTypeMap.get(answer.questionId);
        if (qType === 'RATING' && (answer.rating == null || answer.rating < 1 || answer.rating > 5)) {
            throw new AppError(`Question ${answer.questionId} requires a rating between 1 and 5.`, 400);
        }
    }
    // Build the batch payload
    const createPayload = answers.map((answer) => ({
        sessionId,
        studentId,
        questionId: answer.questionId,
        rating: answer.rating ?? null,
        comment: answer.comment ?? null,
    }));
    // Atomically write all responses in a single transaction
    await prisma.$transaction(async (tx) => {
        await tx.surveyResponse.createMany({
            data: createPayload,
            skipDuplicates: false, // Let the DB unique constraint surface any race-condition duplicates
        });
    });
    return {
        submitted: createPayload.length,
        sessionId,
        studentId,
    };
};
//# sourceMappingURL=student-survey.service.js.map