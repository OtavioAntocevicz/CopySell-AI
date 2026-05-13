/** @module src/server/listing/semantic/config.ts */

import type { ListingCategorySlug } from "./types";

/** Frases vagas / hype (minúsculas, sem acento, para match). */
export const BASE_HYPE_PHRASES: readonly string[] = [
  "alta qualidade",
  "excelente produto",
  "super potente",
  "ideal para qualquer servico",
  "ideal para qualquer situacao",
  "ampla gama de trabalhos",
  "praticidade e eficiencia",
  "produto premium",
  "experiencia imersiva",
  "alta performance",
  "marca reconhecida",
  "melhor custo beneficio do mercado",
  "nao perca essa oportunidade",
  "imperdivel",
  "confira ja",
  "garanta ja o seu",
];

/** Extensões por categoria (MVP: poucos termos; crescer com dados reais). */
export const HYPE_PHRASES_BY_CATEGORY: Partial<
  Record<ListingCategorySlug, readonly string[]>
> = {
  eletronicos: ["imersivo", "imersiva", "audio premium"],
  beleza_cuidados: ["pele perfeita", "resultados imediatos"],
  moda: ["look perfeito", "estilo unico"],
};

/** Padrões “chatgptês” (frases inteiras). */
export const CHATGPT_PHRASES: readonly string[] = [
  "e importante ressaltar",
  "vale destacar que",
  "sem duvidas",
  "com certeza",
  "perfeito para voce",
  "ideal para o dia a dia",
  "sua melhor escolha",
  "nao fique de fora",
];

/**
 * Termos técnicos / de posicionamento que só devem permanecer se aparecerem
 * no texto de evidência (nome, notas do vendedor, rótulo de categoria).
 */
export const BASE_DANGEROUS_CLAIM_TERMS: readonly string[] = [
  "brushless",
  "impacto",
  "cancelamento de ruido",
  "anc",
  "ip68",
  "ip67",
  "original",
  "genuino",
  "homologado",
  "inmetro",
  "garantia estendida",
  "premium",
  "profissional",
  "industrial",
];

export const DANGEROUS_CLAIM_TERMS_BY_CATEGORY: Partial<
  Record<ListingCategorySlug, readonly string[]>
> = {
  automotivo: ["oem"],
  ferramentas: ["brushless", "impacto"],
  eletronicos: ["anc", "noise cancelling", "cancelamento de ruido"],
};

export function hypePhrasesForCategory(
  category: ListingCategorySlug,
): readonly string[] {
  const extra = HYPE_PHRASES_BY_CATEGORY[category] ?? [];
  return [...BASE_HYPE_PHRASES, ...extra];
}
