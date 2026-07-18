import { z } from "zod";

const noteTypeSchema = z.enum(["NOTE", "CALL", "MEETING", "EMAIL"]);

export const addNoteSchema = z.object({
  type: noteTypeSchema,
  content: z.string().trim().min(1).max(10_000),
  pinned: z.boolean().default(false),
});
export const updateNoteSchema = z.object({
  type: noteTypeSchema,
  content: z.string().trim().min(1).max(10_000),
});
export const pinNoteSchema = z.object({
  pinned: z.boolean(),
});

export type AddNoteDto = z.infer<typeof addNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
export type PinNoteDto = z.infer<typeof pinNoteSchema>;
