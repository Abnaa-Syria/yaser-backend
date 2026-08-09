import { prisma } from '../../../prisma.js';
import { AppError } from '../../../utils/AppError.js';
// ─── Get Instructor Self-Evaluation Questions ───────────────────────────────────
/**
 * Returns all active INSTRUCTOR_SELF questions, ordered for display.
 * Also filters out already-answered questions for this (sessionId, instructorId) pair
 * so re-visiting the page reflects actual pending state.
 */
export const getInstructorPendingQuestions = async (sessionId, instructorId) => {
    // Verify session exists and belongs to this instructor
    const session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true, instructorId: true },
    });
    if (!session) {
        throw new AppError('Live session not found.', 404);
    }
    if (session.instructorId !== instructorId) {
        throw new AppError('You are not the assigned instructor for this session.', 403);
    }
    // Fetch IDs the instructor already answered for this session
    const existingResponses = await prisma.surveyResponse.findMany({
        where: { sessionId, studentId: instructorId },
        select: { questionId: true },
    });
    const answeredIds = new Set(existingResponses.map((r) => r.questionId));
    // Fetch all active INSTRUCTOR_SELF questions
    const questions = await prisma.surveyQuestion.findMany({
        where: { isActive: true, category: 'INSTRUCTOR_SELF' },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: {
            id: true,
            textAr: true,
            textEn: true,
            type: true,
            category: true,
            order: true,
        },
    });
    const pending = questions.filter((q) => !answeredIds.has(q.id));
    return {
        sessionId,
        alreadySubmitted: answeredIds.size > 0 && pending.length === 0,
        totalPending: pending.length,
        questions: pending,
    };
};
// ─── Submit Instructor Self-Evaluation ─────────────────────────────────────────
/**
 * Atomically persists the instructor's self-evaluation answers for a session.
 *
 * Guards:
 *  1. Session must exist and the calling user must be its assigned instructor.
 *  2. Duplicate submissions are blocked (pre-flight count + DB unique constraint).
 *  3. All submitted questionIds must be active INSTRUCTOR_SELF questions.
 *  4. RATING-type questions must have a valid 1–5 integer.
 */
export const submitInstructorEvaluation = async (sessionId, instructorId, answers) => {
    // Guard 1: verify session ownership
    const session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        select: { id: true, instructorId: true },
    });
    if (!session) {
        throw new AppError('Live session not found.', 404);
    }
    if (session.instructorId !== instructorId) {
        throw new AppError('You are not the assigned instructor for this session and cannot submit an evaluation for it.', 403);
    }
    // Guard 2: duplicate submission check
    // The SurveyResponse model stores instructorId in the studentId column since
    // the schema uses a unified response table. We use instructorId as the actor ID.
    const existingCount = await prisma.surveyResponse.count({
        where: { sessionId, studentId: instructorId },
    });
    if (existingCount > 0) {
        throw new AppError('You have already submitted your self-evaluation for this session. Duplicate submissions are not allowed.', 409);
    }
    // Guard 3: validate all questionIds are active INSTRUCTOR_SELF questions
    const questionIds = answers.map((a) => a.questionId);
    const validQuestions = await prisma.surveyQuestion.findMany({
        where: {
            id: { in: questionIds },
            isActive: true,
            category: 'INSTRUCTOR_SELF',
        },
        select: { id: true, type: true },
    });
    if (validQuestions.length !== questionIds.length) {
        const validIds = new Set(validQuestions.map((q) => q.id));
        const invalidIds = questionIds.filter((id) => !validIds.has(id));
        throw new AppError(`The following question IDs are invalid, inactive, or not in the INSTRUCTOR_SELF category: ${invalidIds.join(', ')}`, 400);
    }
    // Guard 4: runtime type validation per question
    const questionTypeMap = new Map(validQuestions.map((q) => [q.id, q.type]));
    for (const answer of answers) {
        const qType = questionTypeMap.get(answer.questionId);
        if (qType === 'RATING' && (answer.rating == null || answer.rating < 1 || answer.rating > 5)) {
            throw new AppError(`Question ${answer.questionId} requires a rating between 1 and 5.`, 400);
        }
    }
    // Build batch payload — instructorId stored in studentId column (unified response table)
    const createPayload = answers.map((answer) => ({
        sessionId,
        studentId: instructorId, // actor ID stored in the shared column
        questionId: answer.questionId,
        rating: answer.rating ?? null,
        comment: answer.comment ?? null,
    }));
    // Atomic write
    await prisma.$transaction(async (tx) => {
        await tx.surveyResponse.createMany({
            data: createPayload,
            skipDuplicates: false,
        });
    });
    return {
        submitted: createPayload.length,
        sessionId,
        instructorId,
    };
};
//# sourceMappingURL=instructor-survey.service.js.map