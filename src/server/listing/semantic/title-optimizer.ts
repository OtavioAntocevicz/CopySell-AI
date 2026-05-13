/** @module src/server/listing/semantic/title-optimizer.ts */

import { collapseWhitespace, normalizeForMatch } from "./text-utils";

/** Palavras muito fracas no título (remoção conservadora nas pontas). */
const TITLE_WEAK_WORDS = new Set(
  [
    "de",
    "da",
    "do",
    "das",
    "dos",
    "para",
    "com",
    "por",
    "em",
    "um",
    "uma",
    "o",
    "a",
    "os",
    "as",
    "e",
    "ou",
    "no",
    "na",
    "nos",
    "nas",
    "ao",
    "aos",
    "kit",
    "set",
    "tipo",
  ].map((w) => normalizeForMatch(w)),
);

/**
 * Heurística leve: remove duplicatas adjacentes, poda palavras fracas nas pontas,
 * respeita maxTitleLength sem cortar no meio de palavra quando possível.
 */
export function optimizeTitle(title: string, maxTitleLength: number): string {
  const raw = collapseWhitespace(title);
  if (!raw) return raw;

  const parts = raw.split(/\s+/).filter(Boolean);
  const deduped: string[] = [];
  for (const w of parts) {
    const prev = deduped[deduped.length - 1];
    if (
      prev &&
      normalizeForMatch(prev) === normalizeForMatch(w)
    ) {
      continue;
    }
    deduped.push(w);
  }

  while (
    deduped.length > 2 &&
    TITLE_WEAK_WORDS.has(normalizeForMatch(deduped[0]!))
  ) {
    deduped.shift();
  }
  while (
    deduped.length > 2 &&
    TITLE_WEAK_WORDS.has(normalizeForMatch(deduped[deduped.length - 1]!))
  ) {
    deduped.pop();
  }

  let s = deduped.join(" ");
  if (s.length <= maxTitleLength) return s;

  s = s.slice(0, maxTitleLength).trim();
  const cut = s.lastIndexOf(" ");
  if (cut > maxTitleLength * 0.5) {
    s = s.slice(0, cut).trim();
  }
  return collapseWhitespace(s);
}
