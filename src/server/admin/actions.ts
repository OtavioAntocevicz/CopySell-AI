"use server";

/** @module src/server/admin/actions.ts */

import { revalidatePath } from "next/cache";
import { logServerInfo } from "@/lib/logger";
import { isPlanId } from "@/server/billing/plans";
import { requireAdmin } from "@/server/admin/require-admin";
import {
  getAdminUserWithLimitsById,
  type AdminUserWithLimits,
} from "@/server/admin/queries";
import { getUsagePeriodKeyForUserId } from "@/server/usage/usage-service";
import {
  isSubscriptionStatus,
  type SubscriptionStatus,
} from "@/server/billing/types";

const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function adminSetUserPlan(targetUserId: string, planId: string) {
  const { adminUserId, supabase } = await requireAdmin();
  if (!isPlanId(planId)) {
    throw new Error("Plano inválido");
  }
  const now = new Date().toISOString();
  const freeTierEnd = new Date(Date.now() + MS_30_DAYS).toISOString();

  const patch =
    planId === "free"
      ? {
          plan_id: planId,
          billing_cycle_anchor_at: now,
          free_tier_ends_at: freeTierEnd,
          billing_interval: null,
          subscription_status: "active" as const,
        }
      : {
          plan_id: planId,
          billing_cycle_anchor_at: now,
          free_tier_ends_at: null,
          billing_interval: "month" as const,
          subscription_status: "active" as const,
        };

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", targetUserId);
  if (error) throw error;
  logServerInfo("plan_changed", {
    adminUserId,
    targetUserId,
    planId,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function adminSetUserBlocked(
  targetUserId: string,
  blocked: boolean,
) {
  const { adminUserId, supabase } = await requireAdmin();
  const blocked_at = blocked ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("profiles")
    .update({ blocked_at })
    .eq("id", targetUserId);
  if (error) throw error;
  logServerInfo("user_block_toggled", {
    adminUserId,
    targetUserId,
    blocked,
  });
  revalidatePath("/admin/users");
}

export async function adminSetUserSubscriptionStatus(
  targetUserId: string,
  status: SubscriptionStatus,
) {
  const { adminUserId, supabase } = await requireAdmin();
  if (!isSubscriptionStatus(status)) {
    throw new Error("Status inválido");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ subscription_status: status })
    .eq("id", targetUserId);
  if (error) throw error;
  logServerInfo("subscription_status_changed", {
    adminUserId,
    targetUserId,
    status,
  });
  revalidatePath("/admin/users");
}

export async function adminResetUserMonthlyUsage(targetUserId: string) {
  const { adminUserId, supabase } = await requireAdmin();
  const periodKey = await getUsagePeriodKeyForUserId(supabase, targetUserId);
  if (!periodKey) {
    throw new Error("Período de uso não encontrado");
  }
  const { error } = await supabase
    .from("user_usage_monthly")
    .delete()
    .eq("user_id", targetUserId)
    .eq("period", periodKey);
  if (error) throw error;
  logServerInfo("usage_reset_monthly", {
    adminUserId,
    targetUserId,
    period: periodKey,
  });
  revalidatePath("/admin/users");
}

export async function adminSetBillingRequestStatus(
  requestId: string,
  status: "done" | "dismissed",
) {
  const { adminUserId, supabase } = await requireAdmin();
  const { error } = await supabase
    .from("billing_requests")
    .update({
      status,
      handled_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
  logServerInfo("billing_request_status", {
    adminUserId,
    requestId,
    status,
  });
  revalidatePath("/admin/avisos");
}

export async function fetchAdminUserManageContext(
  userId: string,
): Promise<AdminUserWithLimits | null> {
  const { supabase } = await requireAdmin();
  return getAdminUserWithLimitsById(supabase, userId);
}

export async function adminAddExtraCreditsToUser(
  targetUserId: string,
  amount: number,
): Promise<{ newBalance: number }> {
  const { adminUserId, supabase } = await requireAdmin();
  const n = Math.trunc(Number(amount));
  if (!Number.isFinite(n) || n < 1 || n > 100_000) {
    throw new Error("Informe uma quantidade inteira entre 1 e 100.000.");
  }

  const { data, error } = await supabase.rpc("admin_add_extra_credits", {
    p_target: targetUserId,
    p_amount: n,
  });
  if (error) {
    throw new Error(
      error.message.includes("admin_add_extra_credits")
        ? "Função admin_add_extra_credits ausente. Rode a migration mais recente no Supabase."
        : error.message,
    );
  }
  const bal = typeof data === "number" ? data : Number(data);
  if (!Number.isFinite(bal)) {
    throw new Error("Resposta inválida ao creditar.");
  }

  logServerInfo("admin_extra_credits", {
    adminUserId,
    targetUserId,
    amount: n,
    newBalance: bal,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { newBalance: bal };
}
