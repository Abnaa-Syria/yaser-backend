import { z } from 'zod';

const sourceTypeSchema = z.enum(['RECORDED_LESSON']);

export const recordingDetailParamSchema = z.object({
  params: z.object({
    sourceType: sourceTypeSchema,
    id: z.string().uuid('Invalid recording id'),
  }),
});

export const createPlaybackNoteSchema = z.object({
  params: z.object({
    sourceType: sourceTypeSchema,
    id: z.string().uuid('Invalid recording id'),
  }),
  body: z.object({
    content: z.string().min(1).max(5000),
    timestampSeconds: z.number().int().min(0).nullable().optional(),
  }),
});

export const updatePlaybackNoteSchema = z.object({
  params: z.object({
    sourceType: sourceTypeSchema,
    id: z.string().uuid('Invalid recording id'),
    noteId: z.string().uuid('Invalid note id'),
  }),
  body: z.object({
    content: z.string().min(1).max(5000).optional(),
    timestampSeconds: z.number().int().min(0).nullable().optional(),
  }),
});

export const recordingNoteParamSchema = z.object({
  params: z.object({
    sourceType: sourceTypeSchema,
    id: z.string().uuid('Invalid recording id'),
    noteId: z.string().uuid('Invalid note id'),
  }),
});

// Legacy aliases
export const recordingSourceParamsSchema = recordingDetailParamSchema;
export const createNoteSchema = createPlaybackNoteSchema;
export const updateNoteSchema = updatePlaybackNoteSchema;
export const deleteNoteParamsSchema = recordingNoteParamSchema;
