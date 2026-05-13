"use client";

/**
 * @module src/components/admin/AdminUserActions
 * Selects e botoes para plano, status de assinatura, bloqueio e reset de uso mensal (Server Actions admin).
 */
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  adminResetUserMonthlyUsage,
  adminSetUserBlocked,
  adminSetUserPlan,
  adminSetUserSubscriptionStatus,
} from "@/server/admin/actions";
import { PLAN_IDS, type PlanId } from "@/server/billing/plans";
import type { SubscriptionStatus } from "@/server/billing/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBSCRIPTION_OPTIONS: SubscriptionStatus[] = [
  "active",
  "inactive",
  "expired",
  "canceled",
];

type Props = {
  userId: string;
  planId: string;
  blocked: boolean;
  subscriptionStatus: string;
  /** `stack`: coluna única para uso em modal */
  variant?: "inline" | "stack";
};

export function AdminUserActions({
  userId,
  planId,
  blocked,
  subscriptionStatus,
  variant = "inline",
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const safeStatus = SUBSCRIPTION_OPTIONS.includes(
    subscriptionStatus as SubscriptionStatus,
  )
    ? subscriptionStatus
    : "active";

  const isStack = variant === "stack";

  return (
    <div
      className={
        isStack
          ? "flex w-full flex-col gap-3"
          : "flex max-w-[420px] flex-wrap items-center gap-2"
      }
    >
      <Select
        disabled={pending}
        value={planId}
        onValueChange={(v) => {
          if (!v) return;
          start(async () => {
            await adminSetUserPlan(userId, v);
            router.refresh();
          });
        }}
      >
        <SelectTrigger
          className={cn("h-9 text-xs", isStack ? "w-full" : "w-[118px]")}
        >
          <SelectValue placeholder="Plano" />
        </SelectTrigger>
        <SelectContent>
          {PLAN_IDS.map((id: PlanId) => (
            <SelectItem key={id} value={id} className="text-xs">
              {id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={pending}
        value={safeStatus}
        onValueChange={(v) => {
          if (!v) return;
          start(async () => {
            await adminSetUserSubscriptionStatus(
              userId,
              v as SubscriptionStatus,
            );
            router.refresh();
          });
        }}
      >
        <SelectTrigger
          className={cn("h-9 text-xs", isStack ? "w-full" : "w-[118px]")}
        >
          <SelectValue placeholder="Assinatura" />
        </SelectTrigger>
        <SelectContent>
          {SUBSCRIPTION_OPTIONS.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant={blocked ? "secondary" : "destructive"}
        size="sm"
        className={cn("h-9 text-xs", isStack && "w-full")}
        disabled={pending}
        onClick={() => {
          start(async () => {
            await adminSetUserBlocked(userId, !blocked);
            router.refresh();
          });
        }}
      >
        {blocked ? "Desbloquear" : "Bloquear"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-9 text-xs", isStack && "w-full")}
        disabled={pending}
        onClick={() => {
          start(async () => {
            await adminResetUserMonthlyUsage(userId);
            router.refresh();
          });
        }}
      >
        Zerar ciclo
      </Button>
    </div>
  );
}
