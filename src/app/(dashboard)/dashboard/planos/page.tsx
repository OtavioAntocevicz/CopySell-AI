import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PricingPlans } from "@/components/plans/PricingPlans";
import { loadPricingPlanRows } from "@/server/billing/load-pricing-plans";
import { createClient } from "@/server/supabase/server";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Compare planos Free, Pro e Business - limites mensais, imagens por geração e preços.",
};

export default async function DashboardPlanosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const merged = await loadPricingPlanRows();

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, plan_id")
    .eq("id", user.id)
    .maybeSingle();

  const defaultPhone = (profile?.phone as string | null)?.trim() ?? "";
  const currentPlanId = (profile?.plan_id as string | undefined) ?? "free";

  return (
    <PricingPlans
      plans={merged}
      embedded
      defaultPhone={defaultPhone}
      currentPlanId={currentPlanId}
    />
  );
}
