/** @module src/domains/marketplace/loja-propria/export.ts */

import type {
  ListingExportPayload,
  MarketplaceExporter,
} from "@/domains/marketplace/types";

export const LOJA_PROPRIA_CSV_EXPORT_LAYOUT_VERSION = "copysell-loja-v1";

function headers(): string[] {
  return [
    "nome_produto_base",
    "categoria_app",
    "titulo",
    "slug",
    "meta_title",
    "meta_description",
    "h1",
    "og_description",
    "descricao_curta",
    "descricao_longa",
    "bullets",
    "palavras_chave",
  ];
}

function toRow(payload: ListingExportPayload): Record<string, string> {
  const m = payload.storeMeta ?? {};
  return {
    nome_produto_base: payload.productName,
    categoria_app: payload.category,
    titulo: payload.title,
    slug: m.slug ?? "",
    meta_title: m.meta_title ?? "",
    meta_description: m.meta_description ?? "",
    h1: m.h1_suggestion ?? "",
    og_description: m.og_description ?? "",
    descricao_curta: payload.shortDescription,
    descricao_longa: payload.longDescription,
    bullets: payload.bullets.join(" | "),
    palavras_chave: payload.keywords.join(", "),
  };
}

export const lojaPropriaExporter: MarketplaceExporter = {
  marketplaceId: "loja_propria",
  exportLayoutVersion: LOJA_PROPRIA_CSV_EXPORT_LAYOUT_VERSION,
  headers,
  toRow,
};
