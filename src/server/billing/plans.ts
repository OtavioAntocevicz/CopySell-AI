/** @module src/server/billing/plans.ts */

/** IDs de planos persistidos em `public.plans` (fonte de verdade: banco). */
export const PLAN_IDS = ["free", "pro", "business"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}
