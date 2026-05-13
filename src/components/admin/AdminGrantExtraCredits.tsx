"use client";

/**
 * @module src/components/admin/AdminGrantExtraCredits
 * Formulario para admin creditar pacotes via `adminAddExtraCreditsToUser`.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { adminAddExtraCreditsToUser } from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminGrantExtraCredits({ userId }: { userId: string }) {
  const router = useRouter();
  const [amountStr, setAmountStr] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <Label htmlFor={`credits-${userId}`} className="text-xs font-medium">
        Adicionar créditos extras
      </Label>
      <p className="text-muted-foreground text-xs">
        Quantidade inteira somada ao saldo atual (1 a 100.000). Não expiram.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          id={`credits-${userId}`}
          type="number"
          inputMode="numeric"
          min={1}
          max={100_000}
          placeholder="Ex.: 25"
          value={amountStr}
          disabled={pending}
          onChange={(e) => {
            setAmountStr(e.target.value);
            setMsg(null);
          }}
          className="sm:max-w-[140px]"
        />
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            const n = Number.parseInt(amountStr, 10);
            if (!Number.isFinite(n) || n < 1 || n > 100_000) {
              setMsg({
                ok: false,
                text: "Informe um número inteiro entre 1 e 100.000.",
              });
              return;
            }
            start(async () => {
              try {
                const { newBalance } = await adminAddExtraCreditsToUser(
                  userId,
                  n,
                );
                setAmountStr("");
                setMsg({
                  ok: true,
                  text: `Saldo atualizado: ${newBalance} crédito(s).`,
                });
                router.refresh();
              } catch (e) {
                setMsg({
                  ok: false,
                  text: e instanceof Error ? e.message : "Falha ao creditar.",
                });
              }
            });
          }}
        >
          {pending ? "Aplicando…" : "Aplicar"}
        </Button>
      </div>
      {msg ? (
        <p
          className={
            msg.ok ? "text-muted-foreground text-xs" : "text-destructive text-xs"
          }
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
