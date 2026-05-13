/** @module src/lib/supabase/errors.ts */

import type { PostgrestError } from "@supabase/supabase-js";

/** Mensagem legível para UI/logs quando uma query Supabase falha. */
export function describeSupabaseQueryError(
  context: string,
  error: PostgrestError,
): string {
  const parts = [`[${context}]`, error.message];
  if (error.code) parts.push(`(código ${error.code})`);
  if (error.hint) parts.push(`Dica: ${error.hint}`);

  const msg = error.message.toLowerCase();
  if (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find") ||
    error.code === "42P01"
  ) {
    parts.push(
      "Provavelmente falta aplicar o SQL em supabase/migrations (tabelas listings, credit_balances, etc.).",
    );
  }

  return parts.filter(Boolean).join(" ");
}
