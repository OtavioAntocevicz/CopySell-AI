/** @module src/server/listing/semantic/text-utils.ts */

/** Stopwords leves para dedupe de keywords (PT). */
export const KEYWORD_STOPWORDS: ReadonlySet<string> = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "para",
  "com",
  "sem",
  "por",
  "em",
  "um",
  "uma",
  "o",
  "a",
  "os",
  "as",
]);

/** Normaliza para comparação: minúsculas + sem diacríticos + espaços colapsados. */
export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeForMatch(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Tokens alfanuméricos para overlap / Jaccard. */
export function tokenizeForOverlap(s: string): string[] {
  const raw = normalizeForMatch(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !KEYWORD_STOPWORDS.has(t));
  return raw;
}

export function jaccardSimilarity(a: string, b: string): number {
  const ta = new Set(tokenizeForOverlap(a));
  const tb = new Set(tokenizeForOverlap(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const x of ta) {
    if (tb.has(x)) inter++;
  }
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Containment: um termo contém o outro (após normalizar). */
export function containsSimilarity(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) {
    return 0.92;
  }
  return 0;
}

/** Heurística leve PT: remove 's' final comum para comparar singular/plural. */
export function stemLoose(token: string): string {
  const t = token.toLowerCase();
  if (t.length > 4 && t.endsWith("s") && !t.endsWith("ss")) {
    return t.slice(0, -1);
  }
  return t;
}

function pluralAwareSimilarity(a: string, b: string): number {
  const ta = tokenizeForOverlap(a).map(stemLoose);
  const tb = tokenizeForOverlap(b).map(stemLoose);
  if (ta.length === 0 || tb.length === 0) return 0;
  const sa = new Set(ta);
  const sb = new Set(tb);
  let inter = 0;
  for (const x of sa) {
    if (sb.has(x)) inter++;
  }
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function combinedKeywordSimilarity(a: string, b: string): number {
  return Math.max(
    jaccardSimilarity(a, b),
    containsSimilarity(a, b),
    pluralAwareSimilarity(a, b),
    sharedSignificantTokenBoost(a, b),
  );
}

/** Quando dois termos compartilham um token longo (ex.: "gamer"), sobe a similaridade. */
function sharedSignificantTokenBoost(a: string, b: string): number {
  const ta = tokenizeForOverlap(a);
  const tb = tokenizeForOverlap(b);
  const setB = new Set(tb);
  for (const t of ta) {
    if (t.length >= 4 && setB.has(t)) return 0.62;
  }
  return 0;
}

export function buildEvidenceBlob(parts: {
  productName: string;
  sellerNotes?: string;
  categoryLabel: string;
}): string {
  return normalizeForMatch(
    [parts.productName, parts.sellerNotes ?? "", parts.categoryLabel].join(
      " ",
    ),
  );
}

/** true se o termo (normalizado) aparece como substring na evidência (MVP). */
export function termSupportedInEvidence(
  term: string,
  evidenceNormalized: string,
): boolean {
  const t = normalizeForMatch(term);
  if (t.length < 2) return true;
  return evidenceNormalized.includes(t);
}
