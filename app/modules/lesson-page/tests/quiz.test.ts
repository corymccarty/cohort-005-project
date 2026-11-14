import { describe, it, expect, vi } from "vitest";
import * as schema from "~/db/schema";

// quiz.server.ts reads the app's shared `db`, so the test swaps in an
// in-memory one.
const testDb = await vi.hoisted(async () => {
  const { createTestDb } = await import("~/test/setup");
  return createTestDb();
});
vi.mock("~/db", () => ({ db: testDb }));

const { getQuizInLesson } = await import("../quiz.server");
const { seedBaseData } = await import("~/test/setup");

// lesson-page has no function that writes Lessons or Quizzes, so the rows
// go in directly.
const { course } = seedBaseData(testDb);
const mod = testDb
  .insert(schema.modules)
  .values({ courseId: course.id, title: "Basics", position: 1 })
  .returning()
  .get();

function addLessonWithQuiz(title: string) {
  const lesson = testDb
    .insert(schema.lessons)
    .values({ moduleId: mod.id, title, position: 1 })
    .returning()
    .get();
  const quiz = testDb
    .insert(schema.quizzes)
    .values({ lessonId: lesson.id, title: `${title} quiz`, passingScore: 0.7 })
    .returning()
    .get();
  return { lesson, quiz };
}

const here = addLessonWithQuiz("Here");
const elsewhere = addLessonWithQuiz("Elsewhere");

describe("getQuizInLesson", () => {
  it("finds the quiz that belongs to the lesson", () => {
    expect(getQuizInLesson(here.quiz.id, here.lesson.id)).toEqual(here.quiz);
  });

  it("refuses a quiz that belongs to another lesson", () => {
    expect(getQuizInLesson(elsewhere.quiz.id, here.lesson.id)).toBeUndefined();
  });

  it("refuses a quiz that does not exist", () => {
    expect(getQuizInLesson(9999, here.lesson.id)).toBeUndefined();
  });
});
