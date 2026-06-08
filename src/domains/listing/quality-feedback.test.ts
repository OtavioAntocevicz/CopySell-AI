import { describe, expect, it } from "vitest";
import {
  listingQualityFeedbackSchema,
  PROMPT_TUNE_HINTS,
  QUALITY_ISSUE_TAGS,
} from "./quality-feedback";

describe("listingQualityFeedbackSchema", () => {
  it("exige ao menos uma tag", () => {
    const r = listingQualityFeedbackSchema.safeParse({ issueTags: [] });
    expect(r.success).toBe(false);
  });

  it("aceita tags válidas e notas opcionais", () => {
    const r = listingQualityFeedbackSchema.safeParse({
      issueTags: ["bad_title", "generic_text"],
      notes: "título genérico",
    });
    expect(r.success).toBe(true);
  });
});

describe("PROMPT_TUNE_HINTS", () => {
  it("cobre todas as tags do benchmark", () => {
    for (const tag of QUALITY_ISSUE_TAGS) {
      expect(PROMPT_TUNE_HINTS[tag].length).toBeGreaterThan(10);
    }
  });
});
