/** @module src/server/usage/billing-period.ts */

/**
 * Ciclo de uso mensal alinhado à âncora de assinatura (`billing_cycle_anchor_at`).
 * Plano free: um único período da âncora até `free_tier_ends_at` (30 dias após cadastro).
 */

export type UsagePeriodWindow = {
  periodStart: Date;
  periodEnd: Date;
  /** Chave estável para `user_usage_monthly.period` (ISO UTC do início do ciclo). */
  periodKey: string;
};

function toIsoKey(d: Date): string {
  return d.toISOString();
}

/** Soma meses em UTC preservando o máximo possível o dia do mês. */
export function addMonthsUtc(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) {
    d.setUTCDate(0);
  }
  return d;
}

export type BillingProfileFields = {
  planId: string;
  billingCycleAnchorAt: string;
  freeTierEndsAt: string | null;
  billingInterval: "month" | "year" | null;
};

/**
 * Calcula a janela de uso atual e a chave persistida em `user_usage_monthly.period`.
 */
export function resolveCurrentUsagePeriod(
  profile: BillingProfileFields,
  now = new Date(),
): UsagePeriodWindow {
  const anchor = new Date(profile.billingCycleAnchorAt);

  if (profile.planId === "free" && profile.freeTierEndsAt) {
    const end = new Date(profile.freeTierEndsAt);
    return {
      periodStart: anchor,
      periodEnd: end,
      periodKey: toIsoKey(anchor),
    };
  }

  let start = new Date(anchor.getTime());
  const t = now.getTime();
  while (addMonthsUtc(start, 1).getTime() <= t) {
    start = addMonthsUtc(start, 1);
  }
  const periodEnd = addMonthsUtc(start, 1);
  return {
    periodStart: start,
    periodEnd,
    periodKey: toIsoKey(start),
  };
}
