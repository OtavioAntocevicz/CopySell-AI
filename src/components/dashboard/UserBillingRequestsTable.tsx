/**
 * @module src/components/dashboard/UserBillingRequestsTable
 * Lista solicitacoes de cobranca do usuario logado (cards / tabela responsiva).
 */
import { Badge } from "@/components/ui/badge";
import type { UserBillingRequestRow } from "@/server/billing/billing-requests-queries";

function shortIso(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 16).replace("T", " ");
}

function kindLabel(kind: string): string {
  if (kind === "plan_subscribe") return "Assinatura";
  if (kind === "credit_purchase") return "Créditos";
  if (kind === "support") return "Suporte";
  return kind;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "pending") return "secondary";
  if (status === "done") return "default";
  if (status === "dismissed") return "outline";
  return "outline";
}

function statusLabel(status: string): string {
  if (status === "pending") return "Pendente";
  if (status === "done") return "Concluído";
  if (status === "dismissed") return "Dispensado";
  return status;
}

function rowSummary(row: UserBillingRequestRow): string {
  const p = row.payload;
  if (row.kind === "plan_subscribe") {
    const plan = typeof p.targetPlanId === "string" ? p.targetPlanId : "?";
    const y =
      p.yearly === true ? "anual" : p.yearly === false ? "mensal" : "?";
    return `${plan} (${y})`;
  }
  if (row.kind === "credit_purchase") {
    const label =
      typeof p.label === "string"
        ? p.label
        : typeof p.packId === "string"
          ? p.packId
          : "?";
    const q = typeof p.quantity === "number" ? p.quantity : "?";
    return `${label} · ${q} créditos`;
  }
  if (row.kind === "support") {
    return typeof p.title === "string" ? p.title : "Suporte";
  }
  return "-";
}

export function UserBillingRequestsTable({ rows }: { rows: UserBillingRequestRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhuma solicitação ainda. Planos e créditos enviados pela página Planos
        aparecem aqui automaticamente.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-muted-foreground bg-muted/40 border-b text-left">
            <th className="px-3 py-2.5 font-medium whitespace-nowrap">Data</th>
            <th className="px-3 py-2.5 font-medium whitespace-nowrap">Tipo</th>
            <th className="px-3 py-2.5 font-medium">Resumo</th>
            <th className="px-3 py-2.5 font-medium whitespace-nowrap">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="text-muted-foreground whitespace-nowrap px-3 py-2.5 align-top text-xs tabular-nums">
                {shortIso(row.created_at)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-top">
                {kindLabel(row.kind)}
              </td>
              <td className="max-w-[280px] px-3 py-2.5 align-top text-xs">
                <span className="line-clamp-2" title={rowSummary(row)}>
                  {rowSummary(row)}
                </span>
                {row.kind === "support" &&
                typeof row.payload.message === "string" ? (
                  <span
                    className="text-muted-foreground mt-1 line-clamp-2 block"
                    title={row.payload.message as string}
                  >
                    {(row.payload.message as string).slice(0, 160)}
                    {(row.payload.message as string).length > 160 ? "…" : ""}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2.5 align-top whitespace-nowrap">
                <Badge variant={statusVariant(row.status)} className="font-normal">
                  {statusLabel(row.status)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
