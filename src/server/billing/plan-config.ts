/** @module src/server/billing/plan-config.ts */

/**
 * Metadados estáticos de plano (rótulos para UI).
 * Limites numéricos vêm de `public.plans.limits` + `resolvePlanLimits`.
 */
import type { PlanId } from "./plans";

export function planDisplayLabel(id: PlanId): string {
  switch (id) {
    case "free":
      return "Free";
    case "pro":
      return "Pro";
    case "business":
      return "Business";
  }
}
