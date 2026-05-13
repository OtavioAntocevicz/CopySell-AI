/** @module src/server/listing/semantic/sanitize.ts */

import { CHATGPT_PHRASES, hypePhrasesForCategory } from "./config";
import type { SemanticPostProcessContext } from "./types";
import { collapseWhitespace, escapeRegExp } from "./text-utils";

function stripPhraseList(text: string, phrases: readonly string[]): string {
  let out = text;
  for (const p of phrases) {
    const trimmed = p.trim();
    if (trimmed.length < 3) continue;
    const re = new RegExp(escapeRegExp(trimmed).replace(/\s+/g, "\\s+"), "gi");
    out = out.replace(re, " ");
  }
  return collapseWhitespace(out);
}

/** Remove hype configurável + padrões “chatgptês”. */
export function sanitizeMarketingFluff(
  text: string,
  ctx: SemanticPostProcessContext,
): string {
  const hype = hypePhrasesForCategory(ctx.category);
  let out = stripPhraseList(text, hype);
  out = stripPhraseList(out, CHATGPT_PHRASES);
  return collapseWhitespace(out);
}
