import { z } from 'zod';
const SurveyQuestionTypeEnum = z.enum(['RATING', 'TEXT']);
const SurveyQuestionCategoryEnum = z.enum(['INSTRUCTOR', 'CONTENT', 'PLATFORM', 'INSTRUCTOR_SELF']);
export const createSurveyQuestionSchema = z.object({
    body: z.object({
        textAr: z.string().min(3, 'Arabic question text must be at least 3 characters.'),
        textEn: z.string().min(3, 'English question text must be at least 3 characters.'),
        type: SurveyQuestionTypeEnum,
        category: SurveyQuestionCategoryEnum,
        isActive: z.boolean().optional().default(true),
        order: z.number().int().min(0).optional().default(0),
    }),
});
export const updateSurveyQuestionSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid question ID.'),
    }),
    body: z.object({
        textAr: z.string().min(3).optional(),
        textEn: z.string().min(3).optional(),
        type: SurveyQuestionTypeEnum.optional(),
        category: SurveyQuestionCategoryEnum.optional(),
        isActive: z.boolean().optional(),
        order: z.number().int().min(0).optional(),
    }),
});
export const surveyQuestionIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid question ID.'),
    }),
});
//# sourceMappingURL=admin-survey.validation.js.map