/** @module src/server/listing/semantic/types.ts */

import type {
  GenerateListingFormInput,
  ListingAiOutput,
} from "@/domains/listing/schemas";

export type ListingCategorySlug = GenerateListingFormInput["category"];

/** Contexto mínimo para heurísticas (evolução futura: metadados da imagem, OCR, etc.). */
export type SemanticPostProcessContext = {
  productName: string;
  category: ListingCategorySlug;
  categoryLabel: string;
  sellerNotes?: string;
  maxTitleLength: number;
};

export type SemanticPostProcessResult = {
  output: ListingAiOutput;
  /** true quando o resultado final passou no schema após heurísticas. */
  applied: boolean;
  /** true quando revertemos ao input por falha de validação ou erro. */
  reverted: boolean;
};
