"use client";

/**
 * @module src/components/plans/BillingRequestModal
 * Modal para pedido de upgrade ou compra de creditos (actions de billing).
 */
import { useState, useTransition } from "react";

import {
  submitCreditPurchaseRequest,
  submitPlanSubscriptionRequest,
} from "@/server/billing/billing-request-actions";
import { formatBrlFromCents } from "@/server/billing/catalog";
import type { PlanId } from "@/server/billing/plans";
import type { PricingPlanRow } from "@/components/plans/pricing-plan-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type PlanModeProps = {
  kind: "plan";
  yearly: boolean;
  initialPlanId: Exclude<PlanId, "free">;
  plans: PricingPlanRow[];
};

type CreditModeProps = {
  kind: "credit";
  packId: string;
  quantity: number;
  priceCents: number;
  packLabel: string;
};

export type BillingRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPhone: string;
  mode: PlanModeProps | CreditModeProps;
};

export function BillingRequestModal({
  open,
  onOpenChange,
  defaultPhone,
  mode,
}: BillingRequestModalProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [targetPlan, setTargetPlan] = useState<Exclude<PlanId, "free">>(
    mode.kind === "plan" ? mode.initialPlanId : "pro",
  );
  const [yearly, setYearly] = useState(mode.kind === "plan" ? mode.yearly : false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const planRow =
    mode.kind === "plan"
      ? mode.plans.find((p) => p.id === targetPlan)
      : null;
  const planPrice =
    mode.kind === "plan" && planRow
      ? yearly
        ? planRow.priceYearlyCents
        : planRow.priceMonthlyCents
      : 0;
  const planPeriod =
    mode.kind === "plan" && planRow?.id !== "free"
      ? yearly
        ? "/ano"
        : "/mês"
      : "";

  async function handleSubmit() {
    setMsg(null);
    start(async () => {
      if (mode.kind === "plan") {
        const r = await submitPlanSubscriptionRequest({
          targetPlanId: targetPlan,
          yearly,
          phone,
        });
        if (r.ok) {
          setMsg({
            ok: true,
            text: "Solicitação enviada. Nossa equipe entra em contato pelo WhatsApp informado.",
          });
          return;
        }
        setMsg({ ok: false, text: r.message });
        return;
      }
      const r = await submitCreditPurchaseRequest({
        packId: mode.packId,
        phone,
      });
      if (r.ok) {
        setMsg({
          ok: true,
          text: "Solicitação enviada. O time confirma pagamento e libera os créditos manualmente.",
        });
        return;
      }
      setMsg({ ok: false, text: r.message });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === "plan"
              ? "Solicitar assinatura"
              : "Comprar créditos extras"}
          </DialogTitle>
          <DialogDescription>
            Sem pagamento automático por enquanto: enviamos sua escolha para o
            time e retornamos pelo número informado.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {msg ? (
            <Alert variant={msg.ok ? "default" : "destructive"}>
              <AlertTitle>{msg.ok ? "Enviado" : "Erro"}</AlertTitle>
              <AlertDescription>{msg.text}</AlertDescription>
            </Alert>
          ) : null}

          {mode.kind === "plan" ? (
            <>
              <div className="space-y-2">
                <Label>Plano desejado</Label>
                <div className="flex flex-col gap-2">
                  {(["pro", "business"] as const).map((pid) => (
                    <label
                      key={pid}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm",
                        targetPlan === pid ? "border-foreground bg-muted/40" : "",
                      )}
                    >
                      <input
                        type="radio"
                        name="targetPlan"
                        checked={targetPlan === pid}
                        onChange={() => setTargetPlan(pid)}
                        className="size-4"
                      />
                      <span className="font-medium">
                        {mode.plans.find((p) => p.id === pid)?.name ?? pid}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cobrança</Label>
                <div className="flex gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="billing"
                      checked={!yearly}
                      onChange={() => setYearly(false)}
                    />
                    Mensal
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="billing"
                      checked={yearly}
                      onChange={() => setYearly(true)}
                    />
                    Anual
                  </label>
                </div>
              </div>
              {planRow ? (
                <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
                  <p className="font-medium">Resumo</p>
                  <p className="text-muted-foreground">
                    {planRow.monthlyGenerations} gerações/mês de ciclo · até{" "}
                    {planRow.maxImagesPerGeneration} imagens por geração
                  </p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatBrlFromCents(planPrice)}
                    <span className="text-muted-foreground text-sm font-normal">
                      {planPeriod}
                    </span>
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
              <p className="font-medium">{mode.packLabel}</p>
              <p className="text-muted-foreground">
                {mode.quantity} créditos (1 crédito = 1 geração extra, não expiram)
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatBrlFromCents(mode.priceCents)}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  referência
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Limite de imagens por geração segue o seu plano atual (Free = 1,
                Pro = 3, etc.).
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="req-phone">WhatsApp para contato</Label>
            <Input
              id="req-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="DDD + número"
              autoComplete="tel"
              disabled={pending}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={pending || Boolean(msg?.ok)}
              onClick={() => void handleSubmit()}
            >
              {pending ? "Enviando…" : "Enviar solicitação"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
