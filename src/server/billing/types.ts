/** @module src/server/billing/types.ts */

/** Contrato futuro para Stripe / outros provedores (sem integração ainda). */
export type BillingProviderId = "stripe" | "manual" | null;

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "expired"
  | "canceled";

export type BillingInterval = "month" | "year";

export function isSubscriptionStatus(
  v: string,
): v is SubscriptionStatus {
  return (
    v === "active" ||
    v === "inactive" ||
    v === "expired" ||
    v === "canceled"
  );
}
