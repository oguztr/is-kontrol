export type NoteError =
  | { code: 'PARTNER_NOT_FOUND'; partnerId: string }
  | { code: 'NOTE_NOT_FOUND'; noteId: string }
  | { code: 'NOTE_EDIT_FORBIDDEN'; noteId: string };

export const NoteErrors = {
  partnerNotFound: (partnerId: string): NoteError =>
    ({ code: 'PARTNER_NOT_FOUND', partnerId }),

  notFound: (noteId: string): NoteError =>
    ({ code: 'NOTE_NOT_FOUND', noteId }),

  editForbidden: (noteId: string): NoteError =>
    ({ code: 'NOTE_EDIT_FORBIDDEN', noteId }),
};
