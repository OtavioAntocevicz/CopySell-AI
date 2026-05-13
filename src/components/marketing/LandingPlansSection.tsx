"use client";

/**
 * @module src/components/marketing/LandingPlansSection
 * Secao de precos na landing: toggle mensal/anual, CTA signup, aviso sobre creditos extras.
 */
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import type { PricingPlanRow } from "@/components/plans/pricing-plan-types";
import { formatBrlFromCents } from "@/server/billing/catalog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export function LandingPlansSection({ plans }: { plans: PricingPlanRow[] }) {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="border-t pt-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Planos
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Preços para quando você quiser escalar
        </h2>
        <p className="text-muted-foreground mt-2 text-pretty text-sm md:text-base">
          Compare mensal e anual. Crie uma conta gratuita para testar; upgrade e
          cobrança seguem o fluxo do produto.
        </p>
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
      </div>

      <Alert className="mx-auto mt-8 max-w-3xl">
        <AlertTitle>Créditos extras</AlertTitle>
        <AlertDescription>
          Também oferecemos pacotes de créditos avulsos (não expiram) para picos de
          demanda - disponíveis na área logada, em{" "}
          <strong className="text-foreground">Planos</strong>, após o cadastro.
        </AlertDescription>
      </Alert>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {plans.map((p) => {
          const price =
            p.id === "free"
              ? 0
              : yearly
                ? p.priceYearlyCents
                : p.priceMonthlyCents;
          const periodLabel = p.id === "free" ? "" : yearly ? "/ano" : "/mês";
          const savings =
            p.id !== "free" && yearly && p.yearlySavingsLabel
              ? p.yearlySavingsLabel
              : null;

          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                p.highlight
                  ? "border-violet-500/50 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/25"
                  : "border-border/80",
              )}
            >
              {p.highlight ? (
                <span className="bg-violet-600/10 text-violet-700 dark:text-violet-300 mb-3 self-center rounded-full px-3 py-0.5 text-xs font-medium">
                  Mais popular
                </span>
              ) : null}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{p.tagline}</p>
              <div className="mt-5">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatBrlFromCents(price)}
                </span>
                {periodLabel ? (
                  <span className="text-muted-foreground text-sm">{periodLabel}</span>
                ) : null}
              </div>
              {savings ? (
                <p className="text-muted-foreground mt-1 text-xs">{savings}</p>
              ) : null}
              <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm">
                <li className="text-muted-foreground flex gap-2">
                  <Check className="text-foreground mt-0.5 size-4 shrink-0 opacity-70" />
                  <span>
                    <span className="text-foreground font-medium">
                      {p.monthlyGenerations}
                    </span>{" "}
                    gerações por mês de ciclo
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
                {p.bullets.slice(0, 3).map((b) => (
                  <li key={b} className="text-muted-foreground flex gap-2">
                    <Check className="text-foreground mt-0.5 size-4 shrink-0 opacity-70" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={p.id === "free" ? "/signup" : `/signup?plan=${encodeURIComponent(p.id)}`}
                  className={cn(
                    buttonVariants({
                      variant: p.highlight ? "default" : "outline",
                      className: "w-full",
                    }),
                  )}
                >
                  {p.id === "free" ? "Começar grátis" : "Criar conta"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground mx-auto mt-8 max-w-xl text-center text-sm">
        <Link href="/planos" className="text-foreground font-medium underline-offset-4 hover:underline">
          Página completa de planos
        </Link>{" "}
        (público) com todos os detalhes.
      </p>
    </section>
  );
}
