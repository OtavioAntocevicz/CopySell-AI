/** @module src/lib/listing-clipboard-text.ts */

import type { ListingAiOutput } from "@/domains/listing/schemas";

export function buildListingAiClipboardText(params: {
  productName: string;
  categoryLabel: string;
  output: ListingAiOutput;
}): string {
  const o = params.output;
  const bullets = o.bullets.map((b) => `• ${b}`).join("\n");
  const keywords = o.keywords.join(", ");
  const seo = o.seo_suggestions.join("\n");
  const meta = o.export_meta;
  const storeBlock =
    meta?.slug || meta?.meta_title
      ? [
          "",
          "## SEO loja própria",
          meta.slug ? `Slug: ${meta.slug}` : "",
          meta.meta_title ? `Meta title: ${meta.meta_title}` : "",
          meta.meta_description
            ? `Meta description: ${meta.meta_description}`
            : "",
          meta.h1_suggestion ? `H1: ${meta.h1_suggestion}` : "",
          meta.og_description ? `Open Graph: ${meta.og_description}` : "",
          meta.notes_for_seller ? `Notas: ${meta.notes_for_seller}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

  return [
    `# ${o.title}`,
    "",
    "## Descrição curta",
    o.short_description,
    "",
    "## Descrição longa",
    o.long_description,
    "",
    "## Bullets",
    bullets,
    "",
    "## Palavras-chave",
    keywords,
    "",
    "## Sugestões SEO",
    seo,
    storeBlock,
    "",
    "---",
    `Produto base: ${params.productName}`,
    `Categoria: ${params.categoryLabel}`,
  ].join("\n");
}
