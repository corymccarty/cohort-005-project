import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { notes } from "~/db/schema";
import { lessonRefs } from "~/lib/lesson-ref.server";
import { MAX_NOTE_LENGTH, MIN_NOTE_LENGTH } from "~/lib/notes";

// ─── Notes ───
// A Student's own writing about a Lesson, private to the Student who wrote it.
// See GLOSSARY.md.
//
// Every query here is scoped to one Student's own rows. Nothing outside the
// Student's own Lesson page and Saved page may read a Note body: no
// Instructor or Platform Admin view.
//
// Every function takes the database first, so tests can hand in an in-memory
// one. Content access is the caller's job: the Lesson page action checks it
// before calling in here.

export type Db = BetterSQLite3Database<typeof schema>;

type Note = typeof notes.$inferSelect;

export type SaveNoteResult =
  | { ok: true; note: Note }
  | { ok: false; error: string };

/** What the Lesson page shows of the Student's own Note. */
export type NoteSummary = { body: string; updatedAt: string };

export function getNote(
  db: Db,
  userId: number,
  lessonId: number
): NoteSummary | undefined {
  return db
    .select({ body: notes.body, updatedAt: notes.updatedAt })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
    .get();
}

/**
 * Creates the Student's Note on the Lesson, or replaces its body and moves
 * `updatedAt` on. `createdAt` is kept on a re-save. The body is plain text,
 * trimmed, and refused (never truncated) past MAX_NOTE_LENGTH.
 */
export function saveNote(
  db: Db,
  userId: number,
  lessonId: number,
  body: string,
  now: Date
): SaveNoteResult {
  const trimmed = body.trim();
  if (trimmed.length < MIN_NOTE_LENGTH) {
    return { ok: false, error: "Write something before saving your note." };
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `A note must be ${MAX_NOTE_LENGTH} characters or fewer.`,
    };
  }

  const at = now.toISOString();
  const note = db
    .insert(notes)
    .values({ userId, lessonId, body: trimmed, createdAt: at, updatedAt: at })
    .onConflictDoUpdate({
      target: [notes.userId, notes.lessonId],
      set: { body: trimmed, updatedAt: at },
    })
    .returning()
    .get();

  return { ok: true, note };
}

/** The Student's Notes for the Saved page, last edited first. */
export function listNotes(db: Db, userId: number) {
  const ref = lessonRefs(db);
  return db
    .select({
      id: notes.id,
      body: notes.body,
      updatedAt: notes.updatedAt,
      lessonId: ref.lessonId,
      lessonTitle: ref.lessonTitle,
      courseTitle: ref.courseTitle,
      courseSlug: ref.courseSlug,
    })
    .from(notes)
    .innerJoin(ref, eq(notes.lessonId, ref.lessonId))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt), desc(notes.id))
    .all();
}
