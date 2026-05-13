"use server";

/** @module src/server/billing/billing-request-actions.ts */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logServerInfo } from "@/lib/logger";
import { isPlanId, type PlanId } from "@/server/billing/plans";
import { EXTRA_CREDIT_PACKS, type ExtraCreditPackId } from "@/server/billing/catalog";
import { createClient } from "@/server/supabase/server";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Informe um telefone com DDD")
  .max(24, "Telefone muito longo");

const planPayloadSchema = z.object({
  targetPlanId: z.enum(["pro", "business"]),
  yearly: z.boolean(),
});

const creditPayloadSchema = z.object({
  packId: z.string(),
  quantity: z.number().int().positive(),
  priceCents: z.number().int().positive(),
});

const supportPayloadSchema = z.object({
  title: z.string().trim().min(3, "Título muito curto").max(120),
  message: z.string().trim().min(10, "Descreva com pelo menos 10 caracteres").max(4000),
});

export type BillingRequestResult =
  | { ok: true }
  | { ok: false; message: string };

function isExtraPackId(id: string): id is ExtraCreditPackId {
  return EXTRA_CREDIT_PACKS.some((p) => p.id === id);
}

export async function submitPlanSubscriptionRequest(input: {
  targetPlanId: PlanId;
  yearly: boolean;
  phone: string;
}): Promise<BillingRequestResult> {
  if (input.targetPlanId === "free") {
    return { ok: false, message: "Escolha um plano pago." };
  }
  if (!isPlanId(input.targetPlanId)) {
    return { ok: false, message: "Plano inválido." };
  }
  const phone = phoneSchema.safeParse(input.phone);
  if (!phone.success) {
    return { ok: false, message: phone.error.issues[0]?.message ?? "Telefone inválido" };
  }
  const payload = planPayloadSchema.safeParse({
    targetPlanId: input.targetPlanId,
    yearly: input.yearly,
  });
  if (!payload.success) {
    return { ok: false, message: "Dados do plano inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("billing_requests").insert({
    user_id: user.id,
    kind: "plan_subscribe",
    phone: phone.data,
    payload: payload.data,
    status: "pending",
  });
  if (error) {
    return {
      ok: false,
      message:
        error.message.includes("billing_requests")
          ? "Tabela de solicitações ausente. Rode a migration mais recente no Supabase."
          : error.message,
    };
  }

  logServerInfo("billing_request_plan", {
    userId: user.id,
    plan: input.targetPlanId,
    yearly: input.yearly,
  });
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard/planos");
  revalidatePath("/dashboard/solicitacoes");
  return { ok: true };
}

export async function submitCreditPurchaseRequest(input: {
  packId: string;
  phone: string;
}): Promise<BillingRequestResult> {
  if (!isExtraPackId(input.packId)) {
    return { ok: false, message: "Pacote inválido." };
  }
  const pack = EXTRA_CREDIT_PACKS.find((p) => p.id === input.packId)!;
  const phone = phoneSchema.safeParse(input.phone);
  if (!phone.success) {
    return { ok: false, message: phone.error.issues[0]?.message ?? "Telefone inválido" };
  }
  const payload = creditPayloadSchema.safeParse({
    packId: pack.id,
    quantity: pack.quantity,
    priceCents: pack.priceCents,
  });
  if (!payload.success) {
    return { ok: false, message: "Dados do pacote inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("billing_requests").insert({
    user_id: user.id,
    kind: "credit_purchase",
    phone: phone.data,
    payload: { ...payload.data, label: pack.label },
    status: "pending",
  });
  if (error) {
    return {
      ok: false,
      message:
        error.message.includes("billing_requests")
          ? "Tabela de solicitações ausente. Rode a migration mais recente no Supabase."
          : error.message,
    };
  }

  logServerInfo("billing_request_credits", {
    userId: user.id,
    packId: pack.id,
    quantity: pack.quantity,
  });
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard/planos");
  revalidatePath("/dashboard/solicitacoes");
  return { ok: true };
}

export async function submitSupportRequest(input: {
  title: string;
  message: string;
  phone: string;
}): Promise<BillingRequestResult> {
  const phone = phoneSchema.safeParse(input.phone);
  if (!phone.success) {
    return { ok: false, message: phone.error.issues[0]?.message ?? "Telefone inválido" };
  }
  const payload = supportPayloadSchema.safeParse({
    title: input.title,
    message: input.message,
  });
  if (!payload.success) {
    return {
      ok: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("billing_requests").insert({
    user_id: user.id,
    kind: "support",
    phone: phone.data,
    payload: payload.data,
    status: "pending",
  });
  if (error) {
    return {
      ok: false,
      message:
        error.message.includes("billing_requests")
          ? "Tabela de solicitações ausente ou desatualizada. Rode a migration no Supabase."
          : error.message,
    };
  }

  logServerInfo("billing_request_support", { userId: user.id });
  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard/solicitacoes");
  return { ok: true };
}
