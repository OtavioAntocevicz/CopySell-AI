/** @module src/domains/marketplace/types.ts */

export type MarketplaceId = "mercado_livre" | "loja_propria" | "amazon";

export const MARKETPLACE_IDS = [
  "mercado_livre",
  "loja_propria",
  "amazon",
] as const satisfies readonly MarketplaceId[];

export type ListingConstraints = {
  maxTitleLength: number;
  bulletCountMin: number;
  bulletCountMax: number;
  /** Texto para injetar no prompt da IA (regras do canal) */
  promptRulesBlock: string;
};

export type ExportRow = Record<string, string>;

export type MarketplaceExporter = {
  marketplaceId: MarketplaceId;
  /** Versão do layout de exportação (cada canal evolui o formato com o tempo) */
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
  storeMeta?: ListingStoreMeta;
};

/** Campos extras sugeridos pela IA para loja própria / e-commerce. */
export type ListingStoreMeta = {
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  h1_suggestion?: string;
  og_description?: string;
  notes_for_seller?: string;
};

export type MarketplaceOption = {
  id: MarketplaceId;
  label: string;
  description: string;
  available: boolean;
};

export const MARKETPLACE_OPTIONS: MarketplaceOption[] = [
  {
    id: "mercado_livre",
    label: "Mercado Livre",
    description: "Título curto, bullets e SEO para vitrine ML",
    available: true,
  },
  {
    id: "loja_propria",
    label: "Loja própria",
    description: "E-commerce com slug, meta tags e copy persuasiva",
    available: true,
  },
  {
    id: "amazon",
    label: "Amazon",
    description: "Em breve — formato Amazon BR",
    available: false,
  },
];

export function marketplaceLabel(id: MarketplaceId | string): string {
  const found = MARKETPLACE_OPTIONS.find((o) => o.id === id);
  return found?.label ?? String(id);
}
