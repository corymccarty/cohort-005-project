import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import { noteDraft, type NoteDraft } from "~/modules/lesson-notes";

export type LessonNoteData = { body: string; updatedAt: string } | null;

// Laid out like the Questions & Discussion card (comment-thread.tsx) so the
// two writing surfaces on the Lesson page read as one family.
export function LessonNote({ note }: { note: LessonNoteData }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [body, setBody] = useState(note?.body ?? "");
  const isSaving = fetcher.state !== "idle";
  const draft = noteDraft(body, note?.body ?? "");

  return (
    <Card className="mb-8">
      <CardContent className="px-6">
        <NoteHeader />
        <fetcher.Form method="post" className="space-y-2">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Jot down what you want to remember from this lesson…"
            aria-label="Your notes"
            className="min-h-24 resize-y"
          />
          <NoteFooter
            draft={draft}
            note={note}
            isSaving={isSaving}
            error={fetcher.data?.error}
          />
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteHeader() {
  return (
    <div className="mb-4 flex items-center gap-2">
      <NotebookPen className="size-5 text-primary" />
      <h2 className="text-xl font-semibold">Your notes</h2>
      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="size-3" />
        Only you can see these
      </span>
    </div>
  );
}

function NoteFooter({
  draft,
  note,
  isSaving,
  error,
}: {
  draft: NoteDraft;
  note: LessonNoteData;
  isSaving: boolean;
  error: string | undefined;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" size="sm" disabled={isSaving || !draft.canSave}>
        {isSaving ? "Saving..." : "Save note"}
      </Button>
      {error ? (
        <span className="text-sm text-destructive">{error}</span>
      ) : (
        note && (
          <span
            suppressHydrationWarning
            className="text-xs text-muted-foreground"
          >
            {draft.unchanged ? "Saved" : "Unsaved changes"} · last edited{" "}
            {formatRelativeTime(note.updatedAt)}
          </span>
        )
      )}
      <span
        className={cn(
          "ml-auto text-xs",
          draft.tooLong ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {draft.length} / {draft.limit}
      </span>
    </div>
  );
}
