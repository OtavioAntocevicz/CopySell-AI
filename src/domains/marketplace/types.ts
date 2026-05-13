/** @module src/domains/marketplace/types.ts */

export type MarketplaceId = "mercado_livre";

export type ListingConstraints = {
  maxTitleLength: number;
  bulletCountMin: number;
  bulletCountMax: number;
  /** Texto para injetar no prompt da IA (regras do marketplace) */
  promptRulesBlock: string;
};

export type ExportRow = Record<string, string>;

export type MarketplaceExporter = {
  marketplaceId: MarketplaceId;
  /** Versão do layout de exportação (cada marketplace evolui o formato com o tempo) */
  exportLayoutVersion: string;
  headers: () => string[];
  toRow: (payload: ListingExportPayload) => ExportRow;
};

export type ListingExportPayload = {
  productName: string;
  category: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  bullets: string[];
  keywords: string[];
};
