import type { Metadata } from "next";
import { PricingPlans } from "@/components/plans/PricingPlans";
import { loadPricingPlanRows } from "@/server/billing/load-pricing-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Compare planos Free, Pro e Business - limites mensais, imagens por geração e preços.",
};

export default async function PlanosPage() {
  const merged = await loadPricingPlanRows();
  return <PricingPlans plans={merged} />;
}
