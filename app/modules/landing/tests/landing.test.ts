import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createLanding, FEATURED_COURSE_LIMIT } from "../index.server";

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);
});

// ─── Fixtures ───
// The landing module only reads, so rows go in directly. Kept in one place so
// a schema change touches only this block.

let counter = 0;

function addCourse(
  overrides: Partial<typeof schema.courses.$inferInsert> = {}
) {
  counter++;
  return db
    .insert(schema.courses)
    .values({
      title: `Course ${counter}`,
      slug: `course-${counter}`,
      description: `Description ${counter}`,
      salesCopy: markdown("Sales copy"),
      instructorId: base.instructor.id,
      categoryId: base.category.id,
      status: CourseStatus.Published,
      // After the base course, which seedBaseData stamps with the real clock.
      createdAt: new Date(Date.now() + counter * 60_000).toISOString(),
      ...overrides,
    })
    .returning()
    .get();
}

function addLessons(courseId: number, lessonCount: number) {
  const mod = db
    .insert(schema.modules)
    .values({ courseId, title: "Module", position: 1 })
    .returning()
    .get();
  for (let position = 1; position <= lessonCount; position++) {
    db.insert(schema.lessons)
      .values({ moduleId: mod.id, title: `Lesson ${position}`, position })
      .run();
  }
}

function addInstructor(name: string) {
  return db
    .insert(schema.users)
    .values({
      name,
      email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
      role: UserRole.Instructor,
    })
    .returning()
    .get();
}

function addCategory(name: string) {
  return db
    .insert(schema.categories)
    .values({ name, slug: name.toLowerCase() })
    .returning()
    .get();
}

function get() {
  return createLanding(db).get();
}

describe("spotlight and featured courses", () => {
  it("spotlights the newest published course and features the next ones, up to the limit", () => {
    addCourse({ title: "Oldest" });
    addCourse({ title: "Older" });
    addCourse({ title: "Middle" });
    addCourse({ title: "Newer" });
    addCourse({ title: "Newest" });
    addCourse({ title: "Newer draft", status: CourseStatus.Draft });

    const { spotlight, featuredCourses } = get();

    expect(spotlight?.title).toBe("Newest");
    expect(FEATURED_COURSE_LIMIT).toBe(3);
    expect(featuredCourses.map((c) => c.title)).toEqual([
      "Newer",
      "Middle",
      "Older",
    ]);
  });

  it("has a spotlight but no featured courses when only one is published", () => {
    const { spotlight, featuredCourses } = get();

    expect(spotlight?.id).toBe(base.course.id);
    expect(featuredCourses).toEqual([]);
  });

  it("leaves out drafts and archived courses", () => {
    db.delete(schema.courses).run();
    addCourse({ title: "Draft", status: CourseStatus.Draft });
    addCourse({ title: "Archived", status: CourseStatus.Archived });

    const { spotlight, featuredCourses } = get();

    expect(spotlight).toBeNull();
    expect(featuredCourses).toEqual([]);
  });

  it("carries the instructor, category and lesson count of each course", () => {
    const other = addInstructor("Ada Lovelace");
    const design = addCategory("Design");
    const course = addCourse({
      title: "Tokens",
      instructorId: other.id,
      categoryId: design.id,
      coverImageUrl: "/cover.png",
    });
    addLessons(course.id, 2);
    addLessons(course.id, 3);

    expect(get().spotlight).toEqual({
      id: course.id,
      title: "Tokens",
      slug: course.slug,
      description: course.description,
      coverImageUrl: "/cover.png",
      instructorName: "Ada Lovelace",
      categoryName: "Design",
      lessonCount: 5,
    });
  });

  it("gives a course with no lessons a count of zero", () => {
    db.delete(schema.courses).run();
    addLessons(addCourse().id, 0);

    expect(get().spotlight?.lessonCount).toBe(0);
  });
});

describe("catalogue stats", () => {
  it("counts only what is published", () => {
    addLessons(base.course.id, 4);
    const second = addCourse({
      instructorId: addInstructor("Grace Hopper").id,
      categoryId: addCategory("Data").id,
    });
    addLessons(second.id, 2);
    const draft = addCourse({
      status: CourseStatus.Draft,
      instructorId: addInstructor("Draft Writer").id,
      categoryId: addCategory("Unused").id,
    });
    addLessons(draft.id, 10);

    expect(get().stats).toEqual({
      courses: 2,
      lessons: 6,
      instructors: 2,
      categories: 2,
    });
  });

  it("counts an instructor or category once however many courses share it", () => {
    addCourse();
    addCourse();

    const { stats } = get();

    expect(stats.courses).toBe(3);
    expect(stats.instructors).toBe(1);
    expect(stats.categories).toBe(1);
  });

  it("is all zeroes with nothing published", () => {
    db.delete(schema.courses).run();

    expect(get().stats).toEqual({
      courses: 0,
      lessons: 0,
      instructors: 0,
      categories: 0,
    });
  });
});
