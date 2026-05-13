/** Formato da linha de plano na UI de preços (catálogo + limites do banco). */
export type PricingPlanRow = {
  id: string;
  name: string;
  description: string | null;
  tagline: string;
  bullets: string[];
  highlight?: boolean;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  yearlySavingsLabel: string;
  monthlyGenerations: number;
  maxImagesPerGeneration: number;
};
