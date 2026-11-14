import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteDraft = {
  /** Characters the server will count: the body once trimmed. */
  length: number;
  limit: number;
  empty: boolean;
  tooLong: boolean;
  /** Whether the note is unchanged from the saved one. */
  unchanged: boolean;
  canSave: boolean;
};

export function describeDraft(body: string, savedBody: string): NoteDraft {
  const trimmed = body.trim();
  const length = trimmed.length;
  const empty = length === 0;
  const tooLong = length > MAX_NOTE_LENGTH;
  const unchanged = trimmed === savedBody.trim();
  return {
    length,
    limit: MAX_NOTE_LENGTH,
    empty,
    tooLong,
    unchanged,
    canSave: !empty && !tooLong && !unchanged,
  };
}
