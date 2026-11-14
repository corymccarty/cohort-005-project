import { describe, it, expect } from "vitest";
import { noteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("noteDraft", () => {
  it("cannot save an empty box", () => {
    expect(noteDraft("", "")).toMatchObject({
      length: 0,
      empty: true,
      tooLong: false,
      canSave: false,
    });
  });

  it("treats whitespace alone as empty, as the server does", () => {
    expect(noteDraft("   \n ", "")).toMatchObject({ length: 0, empty: true });
  });

  it("counts the trimmed body against the note limit", () => {
    const draft = noteDraft("  hello  ", "");
    expect(draft.length).toBe(5);
    expect(draft.limit).toBe(MAX_NOTE_LENGTH);
    expect(draft.canSave).toBe(true);
  });

  it("allows a note exactly at the limit", () => {
    expect(noteDraft("a".repeat(MAX_NOTE_LENGTH), "")).toMatchObject({
      tooLong: false,
      canSave: true,
    });
  });

  it("refuses a note one character over the limit", () => {
    expect(noteDraft("a".repeat(MAX_NOTE_LENGTH + 1), "")).toMatchObject({
      tooLong: true,
      empty: false,
      canSave: false,
    });
  });

  it("does not offer to save a note that has not changed", () => {
    expect(noteDraft("same note", "same note")).toMatchObject({
      unchanged: true,
      canSave: false,
    });
  });

  it("ignores surrounding whitespace on either side when comparing", () => {
    expect(noteDraft(" same note", "same note\n").unchanged).toBe(true);
  });

  it("offers to save once the note differs from the saved one", () => {
    expect(noteDraft("new note", "old note")).toMatchObject({
      unchanged: false,
      canSave: true,
    });
  });
});
