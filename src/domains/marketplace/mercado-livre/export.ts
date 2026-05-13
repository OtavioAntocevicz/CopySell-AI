/** @module src/domains/marketplace/mercado-livre/export.ts */

import type { ExportRow, ListingExportPayload, MarketplaceExporter } from "../types";

/**
 * Layout CSV v1 - colunas genéricas úteis para importação em massa / planilhas.
 * Cada marketplace pode exigir colunas adicionais (SKU, preço, estoque, etc.).
 * Valide sempre contra a documentação vigente da plataforma antes de importar.
 */
export const ML_CSV_EXPORT_LAYOUT_VERSION = "copysell-ml-text-v1";

function toMarketplaceCsvRow(payload: ListingExportPayload): ExportRow {
  return {
    nome_produto_base: payload.productName,
    categoria_app: payload.category,
    titulo: payload.title,
    descricao_curta: payload.shortDescription,
    descricao_longa: payload.longDescription,
    bullets: payload.bullets.join(" | "),
    palavras_chave: payload.keywords.join(", "),
  };
}

function headers(): string[] {
  return [
    "nome_produto_base",
    "categoria_app",
    "titulo",
    "descricao_curta",
    "descricao_longa",
    "bullets",
    "palavras_chave",
  ];
}

export const mercadoLivreExporter: MarketplaceExporter = {
  marketplaceId: "mercado_livre",
  exportLayoutVersion: ML_CSV_EXPORT_LAYOUT_VERSION,
  headers,
  toRow: toMarketplaceCsvRow,
};

export { toMarketplaceCsvRow };
