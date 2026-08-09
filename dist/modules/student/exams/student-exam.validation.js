import { z } from 'zod';
export const examIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid exam ID format'),
    }),
});
export const resultIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid exam ID format'),
        submissionId: z.string().uuid('Invalid submission ID format'),
    }),
});
export const submitExamSchema = z.object({
    body: z.object({
        answers: z.array(z.object({
            questionId: z.string().uuid('Invalid question ID format'),
            optionId: z.string().optional(),
            answerText: z.string().nullable().optional()
        }).refine((answer) => answer.optionId !== undefined || answer.answerText !== undefined, {
            message: 'Either optionId or answerText is required',
            path: ['answerText'],
        })).min(1, 'At least one answer is required')
    }),
});
//# sourceMappingURL=student-exam.validation.js.map