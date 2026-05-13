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
    "",
    "---",
    `Produto base: ${params.productName}`,
    `Categoria: ${params.categoryLabel}`,
  ].join("\n");
}
