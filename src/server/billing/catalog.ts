/** @module src/server/billing/catalog.ts */

/**
 * Catálogo comercial (UI + referência de preços).
 * Limites operacionais continuam em `public.plans.limits` + `resolvePlanLimits`.
 */
import type { PlanId } from "./plans";

export type PlanCatalogEntry = {
  id: PlanId;
  /** Preço exibido em centavos BRL (inteiro). */
  priceMonthlyCents: number;
  priceYearlyCents: number;
  /** Frase curta de economia no anual (ex.: ~17%). */
  yearlySavingsLabel: string;
  highlight?: boolean;
  tagline: string;
  bullets: string[];
};

/** Pacotes de créditos extras (1 crédito = 1 geração além do ciclo; não expiram). Preços em centavos BRL. */
export const EXTRA_CREDIT_PACKS = [
  {
    id: "pack_10",
    quantity: 10,
    priceCents: 1500,
    label: "10 créditos",
    blurb: "Ideal para picos de demanda",
  },
  {
    id: "pack_50",
    quantity: 50,
    priceCents: 6000,
    label: "50 créditos",
    blurb: "Melhor custo por geração",
  },
] as const;

export type ExtraCreditPackId = (typeof EXTRA_CREDIT_PACKS)[number]["id"];

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    id: "free",
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    yearlySavingsLabel: "",
    tagline: "Experimente por 30 dias",
    bullets: [
      "Período gratuito de 30 dias",
      "Após o trial: assine um plano ou compre créditos extras (não expiram)",
    ],
  },
  {
    id: "pro",
    priceMonthlyCents: 3900,
    priceYearlyCents: 39000,
    yearlySavingsLabel: "~17% vs mensal",
    highlight: true,
    tagline: "Para quem publica com frequência",
    bullets: [
      "Funcionalidades padrão completas",
      "Suporte prioritário básico",
    ],
  },
  {
    id: "business",
    priceMonthlyCents: 9900,
    priceYearlyCents: 99000,
    yearlySavingsLabel: "~17% vs mensal",
    tagline: "Equipes e volume",
    bullets: [
      "Maior prioridade nas gerações",
      "Suporte prioritário",
      "Base para recursos empresariais futuros",
    ],
  },
];

export function formatBrlFromCents(cents: number): string {
  if (cents <= 0) return "R$ 0";
  const v = cents / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
