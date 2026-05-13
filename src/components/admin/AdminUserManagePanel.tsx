/**
 * @module src/components/admin/AdminUserManagePanel
 * Painel de gestao admin: resumo do usuario, plano, creditos extras, acoes (`AdminUserActions`, `AdminGrantExtraCredits`).
 * Props: `user`, `limits`.
 */
import { Separator } from "@/components/ui/separator";
import { AdminGrantExtraCredits } from "@/components/admin/AdminGrantExtraCredits";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { planDisplayLabel } from "@/server/billing/plan-config";
import { isPlanId } from "@/server/billing/plans";
import type { AdminUserRow } from "@/server/admin/queries";
import type { PlanLimitsResolved } from "@/server/usage/plan-limits";
import {
  sellerSegmentLabel,
  isSellerSegment,
} from "@/lib/profile/seller-segment";

function formatBytes(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

function shortIso(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

export type AdminUserManagePanelProps = {
  user: AdminUserRow;
  limits: PlanLimitsResolved;
};

export function AdminUserManagePanel({ user, limits }: AdminUserManagePanelProps) {
  const blocked = Boolean(user.blocked_at);
  const planLabel = isPlanId(user.plan_id)
    ? planDisplayLabel(user.plan_id)
    : user.plan_id;

  return (
    <>
      <div className="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Contato e perfil
        </p>
        <p>
          Telefone:{" "}
          <span className="font-medium">{user.phone?.trim() || "-"}</span>
        </p>
        <p>
          Perfil de venda:{" "}
          <span className="font-medium">
            {user.seller_segment && isSellerSegment(user.seller_segment)
              ? sellerSegmentLabel(user.seller_segment)
              : "Não informado"}
          </span>
        </p>
        <p>
          Empresa:{" "}
          <span className="font-medium">
            {user.company_name?.trim() || "-"}
          </span>
        </p>
      </div>
      <div className="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Plano e créditos
        </p>
        <p>
          Plano: <span className="font-medium">{planLabel}</span> · Ciclo até{" "}
          <span className="font-medium tabular-nums">
            {shortIso(user.usagePeriodEndsAt)}
          </span>
        </p>
        <p>
          Créditos extras (saldo):{" "}
          <span className="font-mono font-medium tabular-nums">
            {user.extra_credits_balance}
          </span>
        </p>
      </div>
      <div className="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Limites de imagem (plano)
        </p>
        <p>
          Tamanho máximo:{" "}
          <span className="font-medium">{formatBytes(limits.maxImageBytes)}</span>
        </p>
        <p>
          Até{" "}
          <span className="font-medium">{limits.maxImagesPerGeneration}</span>{" "}
          imagem(ns) por geração
        </p>
      </div>
      <Separator />
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Ações administrativas
      </p>
      <AdminGrantExtraCredits userId={user.id} />
      <AdminUserActions
        userId={user.id}
        planId={user.plan_id}
        blocked={blocked}
        subscriptionStatus={user.subscription_status}
        variant="stack"
      />
    </>
  );
}
