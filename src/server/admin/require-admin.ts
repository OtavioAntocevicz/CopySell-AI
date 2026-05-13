/** @module src/server/admin/require-admin.ts */

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase/server";

export type AdminContext = {
  adminUserId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/**
 * Garante sessão autenticada + role admin. Use em layouts/páginas server-only.
 * Deduplicado por request (React cache).
 */
export const requireAdmin = cache(async (): Promise<AdminContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { adminUserId: user.id, supabase };
});
