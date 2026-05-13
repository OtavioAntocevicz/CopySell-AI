import { describe, expect, it } from "vitest";
import type { ListingAiOutput } from "@/domains/listing/schemas";
import {
  computeListingBehaviorDiff,
  outputsDeepEqual,
} from "@/server/listing/behavior/diff";

const base: ListingAiOutput = {
  title: "Fone Bluetooth com microfone",
  short_description: "Fone para chamadas e música com boa qualidade.",
  long_description:
    "Descrição longa com detalhes suficientes para passar no schema mínimo de caracteres. ".repeat(
      5,
    ),
  bullets: ["b1", "b2", "b3", "b4"],
  keywords: ["a", "b", "c", "d", "e"],
  seo_suggestions: ["s1", "s2", "s3"],
};

describe("computeListingBehaviorDiff", () => {
  it("detecta mudanças em título e keywords", () => {
    const next: ListingAiOutput = {
      ...base,
      title: "Fone Bluetooth com microfone gamer",
      keywords: ["a", "b", "c", "d", "x"],
    };
    const d = computeListingBehaviorDiff(base, next);
    expect(d.fieldsChanged).toContain("title");
    expect(d.fieldsChanged).toContain("keywords");
    expect(d.keywords.removed).toContain("e");
    expect(d.keywords.added).toContain("x");
  });
});

describe("outputsDeepEqual", () => {
  it("retorna true para cópia idêntica", () => {
    expect(outputsDeepEqual(base, { ...base })).toBe(true);
  });
});
