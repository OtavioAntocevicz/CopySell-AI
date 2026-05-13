/** @module src/server/listing/behavior/diff.ts */

import type { ListingAiOutput } from "@/domains/listing/schemas";
import { normalizeForMatch } from "@/server/listing/semantic/text-utils";
import type {
  ListingBehaviorDiff,
  ListingOutputFieldKey,
} from "./types";

function normLine(s: string): string {
  return normalizeForMatch(s);
}

function stringChanged(a: string, b: string): boolean {
  return normLine(a) !== normLine(b);
}

function arrayDiffKeywords(before: string[], after: string[]): {
  added: string[];
  removed: string[];
} {
  const setB = new Set(after.map((x) => normalizeForMatch(x)));
  const setA = new Set(before.map((x) => normalizeForMatch(x)));
  const added = after.filter((x) => !setA.has(normalizeForMatch(x)));
  const removed = before.filter((x) => !setB.has(normalizeForMatch(x)));
  return { added, removed };
}

function bulletChangedIndices(
  before: string[],
  after: string[],
): number[] {
  const max = Math.max(before.length, after.length);
  const out: number[] = [];
  for (let i = 0; i < max; i++) {
    const b = before[i] ?? "";
    const a = after[i] ?? "";
    if (normLine(b) !== normLine(a)) out.push(i);
  }
  return out;
}

export function computeListingBehaviorDiff(
  ai: ListingAiOutput,
  finalOut: ListingAiOutput,
): ListingBehaviorDiff {
  const fieldsChanged: ListingOutputFieldKey[] = [];

  if (stringChanged(ai.title, finalOut.title)) fieldsChanged.push("title");
  if (stringChanged(ai.short_description, finalOut.short_description)) {
    fieldsChanged.push("short_description");
  }
  if (stringChanged(ai.long_description, finalOut.long_description)) {
    fieldsChanged.push("long_description");
  }

  const bulletIdx = bulletChangedIndices(ai.bullets, finalOut.bullets);
  if (bulletIdx.length > 0) fieldsChanged.push("bullets");

  const kw = arrayDiffKeywords(ai.keywords, finalOut.keywords);
  if (kw.added.length > 0 || kw.removed.length > 0) {
    fieldsChanged.push("keywords");
  }

  const seoIdx = bulletChangedIndices(
    ai.seo_suggestions,
    finalOut.seo_suggestions,
  );
  if (seoIdx.length > 0) fieldsChanged.push("seo_suggestions");

  return {
    fieldsChanged,
    title: {
      beforeLen: ai.title.length,
      afterLen: finalOut.title.length,
      delta: finalOut.title.length - ai.title.length,
      shortened: finalOut.title.length < ai.title.length,
      normalizedEquals: normLine(ai.title) === normLine(finalOut.title),
    },
    short_description: {
      beforeLen: ai.short_description.length,
      afterLen: finalOut.short_description.length,
      delta:
        finalOut.short_description.length - ai.short_description.length,
    },
    long_description: {
      beforeLen: ai.long_description.length,
      afterLen: finalOut.long_description.length,
      delta: finalOut.long_description.length - ai.long_description.length,
    },
    bullets: {
      countBefore: ai.bullets.length,
      countAfter: finalOut.bullets.length,
      changedIndices: bulletIdx,
    },
    keywords: {
      before: [...ai.keywords],
      after: [...finalOut.keywords],
      added: kw.added,
      removed: kw.removed,
    },
    seo_suggestions: {
      countBefore: ai.seo_suggestions.length,
      countAfter: finalOut.seo_suggestions.length,
      changedIndices: seoIdx,
    },
  };
}

export function outputsDeepEqual(
  a: ListingAiOutput,
  b: ListingAiOutput,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
