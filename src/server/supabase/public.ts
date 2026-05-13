/** @module src/server/supabase/public.ts */

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente só com a chave anon, sem cookies de sessão.
 * Use em páginas públicas (ex.: catálogo de planos) para não disparar
 * refresh de JWT em Server Components onde cookies não podem ser gravados.
 */
export function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
