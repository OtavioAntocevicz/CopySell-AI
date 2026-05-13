/** @module src/server/listing/behavior/metrics.ts */

import type { ListingBehaviorDiff, ListingBehaviorMetrics } from "./types";

function countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

export function buildListingBehaviorMetrics(
  diff: ListingBehaviorDiff,
  opts: {
    editDurationMs: number | null;
    generationToSaveMs: number | null;
    aiLongDescription: string;
    finalLongDescription: string;
  },
): ListingBehaviorMetrics {
  const titleChanged = diff.fieldsChanged.includes("title");
  const bulletsChangedCount = diff.bullets.changedIndices.length;
  const seoSuggestionsChangedCount = diff.seo_suggestions.changedIndices.length;

  return {
    editedFields: diff.fieldsChanged,
    fieldsEditedCount: diff.fieldsChanged.length,
    titleChanged,
    titleLengthDelta: diff.title.delta,
    titleShortened: diff.title.shortened,
    keywordsAdded: diff.keywords.added.length,
    keywordsRemoved: diff.keywords.removed.length,
    bulletsChangedCount,
    shortDescriptionCharDelta: diff.short_description.delta,
    longDescriptionCharDelta: diff.long_description.delta,
    seoSuggestionsChangedCount,
    editDurationMs: opts.editDurationMs,
    generationToSaveMs: opts.generationToSaveMs,
    longDescriptionDigitDelta:
      countDigits(opts.finalLongDescription) -
      countDigits(opts.aiLongDescription),
  };
}
