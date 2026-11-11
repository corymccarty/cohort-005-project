import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { bookmarks } from "~/db/schema";
import { lessonRefs } from "~/lib/lesson-ref.server";

// ─── Bookmarks ───
// A Student's flag on a Lesson. See GLOSSARY.md.
//
// Every function takes the database first, so tests can hand in an in-memory
// one. Content access is the caller's job: the Lesson page action checks it
// before calling in here.

export type Db = BetterSQLite3Database<typeof schema>;

export function isBookmarked(db: Db, userId: number, lessonId: number) {
  return !!db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId)))
    .get();
}

/**
 * Adds the Bookmark if the Lesson has none, removes it if it has one.
 * Returns whether the Lesson is bookmarked afterwards. The unique index on
 * (user, lesson) means a racing insert is a no-op, never a second row.
 */
export function toggleBookmark(
  db: Db,
  userId: number,
  lessonId: number,
  now: Date
): boolean {
  const removed = db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId)))
    .returning({ id: bookmarks.id })
    .all();
  if (removed.length > 0) return false;

  db.insert(bookmarks)
    .values({ userId, lessonId, createdAt: now.toISOString() })
    .onConflictDoNothing()
    .run();
  return true;
}

/** The Student's Bookmarks for the Saved page, newest first. */
export function listBookmarks(db: Db, userId: number) {
  const ref = lessonRefs(db);
  return db
    .select({
      id: bookmarks.id,
      createdAt: bookmarks.createdAt,
      lessonId: ref.lessonId,
      lessonTitle: ref.lessonTitle,
      courseTitle: ref.courseTitle,
      courseSlug: ref.courseSlug,
    })
    .from(bookmarks)
    .innerJoin(ref, eq(bookmarks.lessonId, ref.lessonId))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
    .all();
}
