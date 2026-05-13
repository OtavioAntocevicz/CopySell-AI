/** @module src/server/listing/semantic/dangerous-claims.ts */

import {
  BASE_DANGEROUS_CLAIM_TERMS,
  DANGEROUS_CLAIM_TERMS_BY_CATEGORY,
} from "./config";
import type { ListingCategorySlug } from "./types";
import {
  collapseWhitespace,
  escapeRegExp,
  normalizeForMatch,
  termSupportedInEvidence,
} from "./text-utils";

export function dangerousClaimTermsForCategory(
  category: ListingCategorySlug,
): string[] {
  const extra = DANGEROUS_CLAIM_TERMS_BY_CATEGORY[category] ?? [];
  const merged = new Set<string>(
    [...BASE_DANGEROUS_CLAIM_TERMS, ...extra].map((t) =>
      normalizeForMatch(t),
    ),
  );
  return [...merged].filter((t) => t.length > 1);
}

/**
 * Remove termos de claim não sustentados pela evidência (nome + notas + categoria).
 * Usa match por palavra/frase (heurística; evolução futura: OCR / atributos).
 */
export function stripUnsupportedClaims(
  text: string,
  evidenceNormalized: string,
  terms: readonly string[],
): string {
  let out = text;
  for (const raw of terms) {
    const t = normalizeForMatch(raw);
    if (!t || termSupportedInEvidence(t, evidenceNormalized)) continue;
    const escaped = escapeRegExp(t).replace(/\s+/g, "\\s+");
    const re = t.includes(" ")
      ? new RegExp(escaped, "gi")
      : new RegExp(`\\b${escaped}\\b`, "gi");
    out = out.replace(re, " ");
  }
  return collapseWhitespace(out);
}

/**
 * Remove menções do tipo "12V", "127 V" se o valor não aparecer na evidência
 * (evita voltagem inventada em keywords/título).
 */
export function stripVoltageNotInEvidence(
  text: string,
  evidenceNormalized: string,
): string {
  let out = text;
  const re = /\b(\d{2,3})\s*v\b/gi;
  out = out.replace(re, (full, digits: string) => {
    const compact = `${digits}v`.toLowerCase();
    const spaced = `${digits} v`.toLowerCase();
    if (
      evidenceNormalized.includes(compact) ||
      evidenceNormalized.includes(spaced)
    ) {
      return full;
    }
    return " ";
  });
  return collapseWhitespace(out);
}
