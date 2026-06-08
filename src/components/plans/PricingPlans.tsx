"use client";

/**
 * @module src/components/plans/PricingPlans
 * UI de planos na area logada: toggle mensal/anual, pacotes de creditos extras, modais de pedido manual.
 */
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import type { PlanId } from "@/server/billing/plans";
import { EXTRA_CREDIT_PACKS, formatBrlFromCents } from "@/server/billing/catalog";
import { BillingRequestModal } from "@/components/plans/BillingRequestModal";
import type { PricingPlanRow } from "@/components/plans/pricing-plan-types";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export type { PricingPlanRow } from "@/components/plans/pricing-plan-types";

type TopTab = "subscription" | "credits";

type BillingModalState =
  | null
  | {
      kind: "plan";
      initialPlanId: Exclude<PlanId, "free">;
      yearly: boolean;
    }
  | { kind: "credit"; packId: (typeof EXTRA_CREDIT_PACKS)[number]["id"] };

type Props = {
  plans: PricingPlanRow[];
  /** Dentro do layout do dashboard: fluxo de solicitação manual + telefone. */
  embedded?: boolean;
  defaultPhone?: string;
  /** Plano atual do usuário (dashboard) para desabilitar CTAs redundantes. */
  currentPlanId?: string;
};

const LOGIN_PLANOS = "/login?redirect=/dashboard/planos";

export function PricingPlans({
  plans,
  embedded = false,
  defaultPhone = "",
  currentPlanId,
}: Props) {
  const [yearly, setYearly] = useState(false);
  const [topTab, setTopTab] = useState<TopTab>("subscription");
  const [billingModal, setBillingModal] = useState<BillingModalState>(null);

  const creditPack =
    billingModal?.kind === "credit"
      ? EXTRA_CREDIT_PACKS.find((p) => p.id === billingModal.packId)
      : null;

  return (
    <div className="w-full min-w-0">
      {!embedded ? (
        <header className="border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              CopySell AI
            </Link>
            <div className="flex gap-2">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Entrar
              </Link>
              <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
                Criar conta
              </Link>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={cn(
          "mx-auto max-w-6xl px-4",
          embedded ? "py-6 md:py-10" : "py-16 md:py-24",
        )}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Preços
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Planos claros. Escala quando você precisar.
          </h1>
          <p className="text-muted-foreground mt-3 text-pretty text-sm md:text-base">
            Assinatura mensal ou anual, créditos extras que não expiram e
            atendimento manual até o gateway de pagamento estar pronto.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-border bg-muted/40 p-1">
            <button
              type="button"
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                topTab === "subscription"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
              onClick={() => setTopTab("subscription")}
            >
              Planos
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                topTab === "credits"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
              onClick={() => setTopTab("credits")}
            >
              Créditos extras
            </button>
          </div>

          {topTab === "subscription" ? (
            <div className="mt-6 inline-flex rounded-full border border-border bg-muted/40 p-1">
              <button
                type="button"
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  !yearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
                onClick={() => setYearly(false)}
              >
                Mensal
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  yearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
                onClick={() => setYearly(true)}
              >
                Anual
              </button>
            </div>
          ) : null}
        </div>

        {topTab === "subscription" ? (
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const price =
                p.id === "free"
                  ? 0
                  : yearly
                    ? p.priceYearlyCents
                    : p.priceMonthlyCents;
              const periodLabel =
                p.id === "free" ? "" : yearly ? "/ano" : "/mês";
              const savings =
                p.id !== "free" && yearly && p.yearlySavingsLabel
                  ? p.yearlySavingsLabel
                  : null;

              const isCurrentPaid =
                embedded &&
                currentPlanId &&
                p.id !== "free" &&
                currentPlanId === p.id;

              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow",
                    p.highlight
                      ? "border-violet-500/50 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/25 md:-translate-y-1 md:scale-[1.02]"
                      : "border-border/80",
                  )}
                >
                  {p.highlight ? (
                    <span className="bg-violet-600/10 text-violet-700 dark:text-violet-300 mb-3 self-center rounded-full px-3 py-0.5 text-xs font-medium">
                      Mais popular
                    </span>
                  ) : null}
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{p.tagline}</p>
                  <div className="mt-6">
                    <span className="text-3xl font-semibold tabular-nums">
                      {formatBrlFromCents(price)}
                    </span>
                    {periodLabel ? (
                      <span className="text-muted-foreground text-sm">{periodLabel}</span>
                    ) : null}
                  </div>
                  {savings ? (
                    <p className="text-muted-foreground mt-1 text-xs">{savings}</p>
                  ) : null}

                  <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                    <li className="text-muted-foreground flex gap-2">
                      <Check className="text-foreground mt-0.5 size-4 shrink-0 opacity-70" />
                      <span>
                        <span className="text-foreground font-medium">
                          {p.monthlyGenerations}
                        </span>{" "}
                        {p.id === "free"
                          ? "gerações no período gratuito"
                          : "gerações por mês de ciclo"}
                      </span>
                    </li>
                    <li className="text-muted-foreground flex gap-2">
                      <Check className="text-foreground mt-0.5 size-4 shrink-0 opacity-70" />
                      <span>
                        Até{" "}
                        <span className="text-foreground font-medium">
                          {p.maxImagesPerGeneration}
                        </span>{" "}
                        imagens por geração
                      </span>
                    </li>
                    {p.bullets.map((b) => (
                      <li key={b} className="text-muted-foreground flex gap-2">
                        <Check className="text-foreground mt-0.5 size-4 shrink-0 opacity-70" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {p.id === "free" ? (
                      embedded ? (
                        <span
                          className={cn(
                            buttonVariants({ variant: "outline", className: "w-full" }),
                            "pointer-events-none opacity-80",
                          )}
                        >
                          Plano Free (cadastro)
                        </span>
                      ) : (
                        <Link
                          href="/signup"
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              className: "w-full",
                            }),
                          )}
                        >
                          Começar grátis
                        </Link>
                      )
                    ) : isCurrentPaid ? (
                      <span
                        className={cn(
                          buttonVariants({ variant: "secondary", className: "w-full" }),
                          "pointer-events-none",
                        )}
                      >
                        Seu plano atual
                      </span>
                    ) : embedded ? (
                      <button
                        type="button"
                        className={cn(
                          buttonVariants({
                            variant: p.highlight ? "default" : "outline",
                            className: "w-full",
                          }),
                        )}
                        onClick={() =>
                          setBillingModal({
                            kind: "plan",
                            initialPlanId: p.id as Exclude<PlanId, "free">,
                            yearly,
                          })
                        }
                      >
                        Assinar
                      </button>
                    ) : (
                      <Link
                        href={LOGIN_PLANOS}
                        className={cn(
                          buttonVariants({
                            variant: p.highlight ? "default" : "outline",
                            className: "w-full",
                          }),
                        )}
                      >
                        Assinar
                      </Link>
                    )}
                    <p className="text-muted-foreground mt-2 text-center text-xs">
                      Cobrança online em breve - hoje o upgrade é manual pelo time.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-2xl space-y-6">
            <p className="text-muted-foreground text-center text-sm">
              Créditos extras não expiram e somam ao seu plano. Cada crédito vale
              uma geração quando o ciclo mensal do plano já estiver no limite. O
              número de imagens por geração continua igual ao do seu plano atual.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {EXTRA_CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="flex flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{pack.label}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{pack.blurb}</p>
                  <p className="mt-4 text-2xl font-semibold tabular-nums">
                    {formatBrlFromCents(pack.priceCents)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {pack.quantity} créditos · referência de preço
                  </p>
                  <div className="mt-6">
                    {embedded ? (
                      <button
                        type="button"
                        className={cn(buttonVariants({ className: "w-full" }))}
                        onClick={() =>
                          setBillingModal({ kind: "credit", packId: pack.id })
                        }
                      >
                        Solicitar compra
                      </button>
                    ) : (
                      <Link
                        href={LOGIN_PLANOS}
                        className={cn(buttonVariants({ className: "w-full" }))}
                      >
                        Entrar para solicitar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {billingModal?.kind === "plan" ? (
        <BillingRequestModal
          key={`plan-${billingModal.initialPlanId}-${billingModal.yearly}-${defaultPhone}`}
          open
          onOpenChange={(open) => !open && setBillingModal(null)}
          defaultPhone={defaultPhone}
          mode={{
            kind: "plan",
            yearly: billingModal.yearly,
            initialPlanId: billingModal.initialPlanId,
            plans,
          }}
        />
      ) : billingModal?.kind === "credit" && creditPack ? (
        <BillingRequestModal
          key={`credit-${creditPack.id}-${defaultPhone}`}
          open
          onOpenChange={(open) => !open && setBillingModal(null)}
          defaultPhone={defaultPhone}
          mode={{
            kind: "credit",
            packId: creditPack.id,
            quantity: creditPack.quantity,
            priceCents: creditPack.priceCents,
            packLabel: creditPack.label,
          }}
        />
      ) : null}
    </div>
  );
}
