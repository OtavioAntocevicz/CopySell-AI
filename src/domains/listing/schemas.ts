/** @module src/domains/listing/schemas.ts */

import { z } from "zod";
import { MARKETPLACE_IDS } from "@/domains/marketplace/types";

export const PRODUCT_CATEGORY_VALUES = [
  "eletronicos",
  "moda",
  "casa_decoracao",
  "esporte_lazer",
  "brinquedos",
  "beleza_cuidados",
  "automotivo",
  "ferramentas",
  "outros",
] as const;

function emptyToUndefined(val: unknown): unknown {
  if (val == null || val === "") return undefined;
  const s = String(val).trim();
  return s === "" ? undefined : s;
}

export const marketplaceIdSchema = z.enum(MARKETPLACE_IDS);

export const generateListingFormSchema = z.object({
  marketplace: marketplaceIdSchema,
  productName: z.string().min(2, "Nome muito curto").max(200),
  category: z.enum(PRODUCT_CATEGORY_VALUES),
  sellerNotes: z.preprocess(
    emptyToUndefined,
    z.string().max(4000, "Máximo de 4000 caracteres").optional(),
  ),
});

export type GenerateListingFormInput = z.infer<typeof generateListingFormSchema>;

export const listingStoreMetaSchema = z.object({
  slug: z.string().min(3).max(120).optional(),
  meta_title: z.string().min(5).max(70).optional(),
  meta_description: z.string().min(10).max(180).optional(),
  h1_suggestion: z.string().min(3).max(150).optional(),
  og_description: z.string().min(10).max(220).optional(),
  notes_for_seller: z.string().max(2000).optional(),
});

export const listingAiOutputSchema = z.object({
  title: z.string().min(5).max(120),
  short_description: z.string().min(20).max(1200),
  long_description: z.string().min(80).max(12000),
  bullets: z.array(z.string().min(3)).min(4).max(8),
  keywords: z.array(z.string().min(2)).min(5).max(30),
  seo_suggestions: z.array(z.string().min(3)).min(3).max(20),
  export_meta: listingStoreMetaSchema.optional(),
});

export type ListingAiOutput = z.infer<typeof listingAiOutputSchema>;
export type ListingStoreMeta = z.infer<typeof listingStoreMetaSchema>;

/** Valida export_meta obrigatório para loja própria. */
export const lojaPropriaOutputSchema = listingAiOutputSchema.extend({
  export_meta: listingStoreMetaSchema.extend({
    slug: z.string().min(3).max(120),
    meta_title: z.string().min(5).max(70),
    meta_description: z.string().min(10).max(180),
    h1_suggestion: z.string().min(3).max(150),
    og_description: z.string().min(10).max(220),
  }),
});

export function outputSchemaForMarketplace(
  marketplace: z.infer<typeof marketplaceIdSchema>,
) {
  if (marketplace === "loja_propria") return lojaPropriaOutputSchema;
  return listingAiOutputSchema;
}
