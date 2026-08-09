import { z } from 'zod';
// Validates the :sessionId URL param
export const sessionIdParamSchema = z.object({
    params: z.object({
        sessionId: z.string().uuid('Invalid session ID.'),
    }),
});
// Individual answer item
const instructorAnswerItemSchema = z.object({
    questionId: z.string().uuid('Invalid question ID.'),
    rating: z
        .number()
        .int('Rating must be an integer.')
        .min(1, 'Rating must be at least 1.')
        .max(5, 'Rating must be at most 5.')
        .optional()
        .nullable(),
    comment: z
        .string()
        .max(3000, 'Comment must be under 3000 characters.')
        .optional()
        .nullable(),
});
// Full instructor evaluation submission body
export const submitInstructorEvaluationSchema = z.object({
    body: z.object({
        sessionId: z.string().uuid('Invalid session ID.'),
        answers: z
            .array(instructorAnswerItemSchema)
            .min(1, 'You must submit at least one answer.')
            .max(50, 'Answer payload exceeds the 50-question limit.'),
    }),
});
//# sourceMappingURL=instructor-survey.validation.js.map