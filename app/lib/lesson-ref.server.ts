import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq, sql } from "drizzle-orm";
import * as schema from "~/db/schema";
import { courses, lessons, modules } from "~/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

/**
 * Every Lesson with what a row on the Saved page needs to link to it and name
 * its Course. Join it on `lessonId`. Each column is aliased because a
 * subquery keys columns by name: `lessons.title` and `courses.title` would
 * collide, and so would `lesson_id` with the outer table's column.
 */
export function lessonRefs(db: Db) {
  return db
    .select({
      lessonId: sql<number>`${lessons.id}`.as("ref_lesson_id"),
      lessonTitle: sql<string>`${lessons.title}`.as("ref_lesson_title"),
      courseTitle: sql<string>`${courses.title}`.as("ref_course_title"),
      courseSlug: sql<string>`${courses.slug}`.as("ref_course_slug"),
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .as("lesson_refs");
}
