import { z } from 'zod';
const sourceTypeSchema = z.enum(['LIVE_SESSION', 'RECORDED_LESSON']);
export const recordingDetailParamSchema = z.object({
    params: z.object({
        sourceType: sourceTypeSchema,
        id: z.string().uuid('Invalid recording ID format'),
    }),
});
export const recordingNoteParamSchema = z.object({
    params: z.object({
        sourceType: sourceTypeSchema,
        id: z.string().uuid('Invalid recording ID format'),
        noteId: z.string().uuid('Invalid note ID format'),
    }),
});
export const createPlaybackNoteSchema = z.object({
    params: z.object({
        sourceType: sourceTypeSchema,
        id: z.string().uuid('Invalid recording ID format'),
    }),
    body: z.object({
        content: z.string().min(1, 'Note content is required').max(5000),
        timestampSeconds: z.number().int().min(0).nullable().optional(),
    }),
});
export const updatePlaybackNoteSchema = z.object({
    params: z.object({
        sourceType: sourceTypeSchema,
        id: z.string().uuid('Invalid recording ID format'),
        noteId: z.string().uuid('Invalid note ID format'),
    }),
    body: z.object({
        content: z.string().min(1).max(5000).optional(),
        timestampSeconds: z.number().int().min(0).nullable().optional(),
    }),
});
//# sourceMappingURL=student-recording.validation.js.map