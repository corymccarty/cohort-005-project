import { describeDraft, type NoteDraft } from "./lib/draft";

export type { NoteDraft };

/**
 * What the note form should show for the text in the box: the character
 * count against the limit, and whether Save can be pressed. The limits match
 * the ones `saveNote` enforces, so the form never offers a save the server
 * will refuse.
 */
export function noteDraft(body: string, savedBody: string): NoteDraft {
  return describeDraft(body, savedBody);
}
