import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Garante que a migration de hardening contem as alteracoes criticas.
 * Testes de integracao contra Supabase exigem projeto live; ver
 * supabase/tests/rls_billing_hardening.sql para checklist manual.
 */
describe("RLS billing hardening migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260517120000_copy_sell_schema_merged.sql",
    ),
    "utf8",
  );

  it("nao cria update direto de credit_balances para usuarios", () => {
    expect(sql).toContain('drop policy if exists "credit_balances_update_own"');
    expect(sql).not.toMatch(
      /create policy "credit_balances_update_own"/,
    );
  });

  it("nao cria insert/update direto de user_usage_monthly para usuarios", () => {
    expect(sql).toContain('drop policy if exists "user_usage_monthly_insert_own"');
    expect(sql).toContain('drop policy if exists "user_usage_monthly_update_own"');
    expect(sql).not.toMatch(
      /create policy "user_usage_monthly_insert_own"/,
    );
    expect(sql).not.toMatch(
      /create policy "user_usage_monthly_update_own"/,
    );
  });

  it("endurece increment_own_usage com security definer e validacao", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("invalid increment values");
    expect(sql).toContain("p_generations < 0 or p_generations > 1");
  });

  it("endurece decrement_own_extra_credit com security definer", () => {
    expect(sql).toMatch(
      /create or replace function public\.decrement_own_extra_credit[\s\S]*security definer/,
    );
  });
});
