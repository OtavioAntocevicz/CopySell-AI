/** @module src/domains/listing/quality-feedback.ts */

import { z } from "zod";

export const QUALITY_ISSUE_TAGS = [
  "invented_specs",
  "bad_title",
  "generic_text",
  "bad_bullets",
  "bad_keywords",
  "would_not_use",
] as const;

export type QualityIssueTag = (typeof QUALITY_ISSUE_TAGS)[number];

export const QUALITY_ISSUE_LABELS: Record<QualityIssueTag, string> = {
  invented_specs: "Inventou marca, modelo ou especificação",
  bad_title: "Título fraco ou fora do limite",
  generic_text: "Texto genérico de IA",
  bad_bullets: "Bullets pouco úteis",
  bad_keywords: "Keywords irrelevantes",
  would_not_use: "Não usaria sem reescrever tudo",
};

export const listingQualityFeedbackSchema = z.object({
  issueTags: z
    .array(z.enum(QUALITY_ISSUE_TAGS))
    .min(1, "Marque pelo menos um problema"),
  notes: z.string().max(2000).optional(),
});

export type ListingQualityFeedbackInput = z.infer<
  typeof listingQualityFeedbackSchema
>;

/** Sugestões exibidas no admin quando um tag aparece 3+ vezes na janela. */
export const PROMPT_TUNE_HINTS: Record<QualityIssueTag, string> = {
  invented_specs:
    "Reforçar regras anti-alucinação em mercado-livre-v3.ts e dangerous-claims no pós-processamento.",
  bad_title:
    "Ajustar hierarquia de título e title-optimizer.ts (comprimento e termos fracos).",
  generic_text:
    "Expandir frases proibidas em semantic/config.ts e regras de estilo no prompt.",
  bad_bullets:
    "Exigir bullets mais objetivos e uma ideia por item no prompt.",
  bad_keywords:
    "Refinar regras de keywords (dedupe, relevância) no prompt e semantic-post-process.",
  would_not_use:
    "Revisar exemplos no prompt e aumentar especificidade por categoria de produto.",
};
