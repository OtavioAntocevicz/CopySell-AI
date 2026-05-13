/** @module src/server/listing/semantic/semantic-post-process.ts */

import { listingAiOutputSchema, type ListingAiOutput } from "@/domains/listing/schemas";
import { logServerInfo, logServerWarn } from "@/lib/logger";
import { buildEvidenceBlob, collapseWhitespace } from "./text-utils";
import { dangerousClaimTermsForCategory, stripUnsupportedClaims, stripVoltageNotInEvidence } from "./dangerous-claims";
import { dedupeKeywordsStable } from "./keyword-dedupe";
import { sanitizeMarketingFluff } from "./sanitize";
import type {
  SemanticPostProcessContext,
  SemanticPostProcessResult,
} from "./types";
import { optimizeTitle } from "./title-optimizer";

function cloneListing(o: ListingAiOutput): ListingAiOutput {
  return JSON.parse(JSON.stringify(o)) as ListingAiOutput;
}

function shallowSignature(o: ListingAiOutput): string {
  return JSON.stringify({
    t: o.title,
    s: o.short_description,
    l: o.long_description,
    b: o.bullets,
    k: o.keywords,
    e: o.seo_suggestions,
  });
}

/**
 * Pós-processamento semântico leve (sem segunda chamada LLM).
 * Se o resultado não passar no Zod, reverte ao input.
 */
export function semanticPostProcess(
  input: ListingAiOutput,
  ctx: SemanticPostProcessContext,
): SemanticPostProcessResult {
  const original = cloneListing(input);
  try {
    const evidence = buildEvidenceBlob({
      productName: ctx.productName,
      sellerNotes: ctx.sellerNotes,
      categoryLabel: ctx.categoryLabel,
    });
    const claimTerms = dangerousClaimTermsForCategory(ctx.category);

    const out: ListingAiOutput = { ...input };

    const cleanField = (s: string) => {
      let x = sanitizeMarketingFluff(s, ctx);
      x = stripUnsupportedClaims(x, evidence, claimTerms);
      x = stripVoltageNotInEvidence(x, evidence);
      return collapseWhitespace(x);
    };

    out.title = cleanField(out.title);
    out.title = optimizeTitle(out.title, ctx.maxTitleLength);

    out.short_description = cleanField(out.short_description);
    out.long_description = cleanField(out.long_description);
    out.bullets = out.bullets.map((b) => cleanField(b));
    out.seo_suggestions = out.seo_suggestions.map((s) => cleanField(s));

    const kwSan = out.keywords
      .map((k) => cleanField(k))
      .filter((k) => k.length >= 2);
    out.keywords = dedupeKeywordsStable(kwSan, {
      minKeep: 5,
      similarityThreshold: 0.58,
    });

    const parsed = listingAiOutputSchema.safeParse(out);
    if (!parsed.success) {
      logServerWarn("semantic_post_process_reverted", {
        reason: "zod_failed_after_semantic",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return { output: original, applied: false, reverted: true };
    }

    const changed = shallowSignature(parsed.data) !== shallowSignature(original);
    if (changed) {
      logServerInfo("semantic_post_process_applied", {
        category: ctx.category,
        keywordCountBefore: original.keywords.length,
        keywordCountAfter: parsed.data.keywords.length,
      });
    }

    return { output: parsed.data, applied: changed, reverted: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logServerWarn("semantic_post_process_reverted", {
      reason: "exception",
      message,
    });
    return { output: original, applied: false, reverted: true };
  }
}
