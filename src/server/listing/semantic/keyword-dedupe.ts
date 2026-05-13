/** @module src/server/listing/semantic/keyword-dedupe.ts */

import { combinedKeywordSimilarity, collapseWhitespace } from "./text-utils";

export type KeywordDedupeOptions = {
  /** Mínimo de keywords a manter (schema Zod). */
  minKeep: number;
  /** 0-1: acima disso considera duplicata. */
  similarityThreshold: number;
};

/**
 * Deduplica mantendo a ordem original; prefere manter a primeira ocorrência.
 * Se o resultado cair abaixo de minKeep, devolve a lista original.
 */
export function dedupeKeywordsStable(
  keywords: string[],
  opts: KeywordDedupeOptions,
): string[] {
  const cleaned = keywords
    .map((k) => collapseWhitespace(k))
    .filter((k) => k.length > 0);
  if (cleaned.length <= opts.minKeep) return cleaned;

  const kept: string[] = [];
  for (const kw of cleaned) {
    const dup = kept.some(
      (existing) =>
        combinedKeywordSimilarity(kw, existing) >= opts.similarityThreshold,
    );
    if (dup) continue;
    kept.push(kw);
  }

  if (kept.length < opts.minKeep) return cleaned;
  return kept;
}
