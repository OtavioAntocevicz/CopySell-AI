/** @module src/server/supabase/public.ts */

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente só com a chave anon, sem cookies de sessão.
 * Use em páginas públicas (ex.: catálogo de planos) para não disparar
 * refresh de JWT em Server Components onde cookies não podem ser gravados.
 */
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_PUBLIC_ENV_MISSING");
  }
  return createClient(url, key);
}
