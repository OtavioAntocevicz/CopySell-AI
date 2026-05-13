"use client";

/**
 * @module src/components/admin/AdminBillingRequestsTable
 * Fila de solicitacoes (`billing_requests`): filtros, acoes admin, modal com `AdminUserManagePanel`, links para usuarios.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { MoreVertical } from "lucide-react";

import { AdminUserManagePanel } from "@/components/admin/AdminUserManagePanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminSetBillingRequestStatus,
  fetchAdminUserManageContext,
} from "@/server/admin/actions";
import type {
  AdminBillingRequestRow,
  AdminUserWithLimits,
} from "@/server/admin/queries";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

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

function requestDetail(row: AdminBillingRequestRow): string {
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

function Truncate({
  children,
  title,
  className,
  mono,
}: {
  children: string;
  title?: string;
  className?: string;
  mono?: boolean;
}) {
  const t = title ?? children;
  return (
    <span
      title={t}
      className={cn(
        "block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap",
        mono && "font-mono",
        className,
      )}
    >
      {children}
    </span>
  );
}

const KIND_FILTER_ALL = "all";
const STATUS_FILTER_ALL = "all";

function tableHref(userId: string) {
  return `/admin/users?highlight=${encodeURIComponent(userId)}`;
}

function RowActionsMenu({
  row,
  onOpenManage,
}: {
  row: AdminBillingRequestRow;
  onOpenManage: (userId: string) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (row.status !== "pending") {
    const label = row.handled_at ? shortIso(row.handled_at) : "-";
    return (
      <Truncate title={label} className="text-muted-foreground text-xs tabular-nums">
        {label}
      </Truncate>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      {err ? (
        <Truncate
          title={err}
          className="text-destructive max-w-full text-right text-xs"
        >
          {err}
        </Truncate>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "shrink-0 text-muted-foreground",
          )}
          disabled={pending}
          aria-label="Ações da solicitação"
        >
          <MoreVertical className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={() => onOpenManage(row.user_id)}>
            Gerenciar plano e créditos…
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(tableHref(row.user_id))}
          >
            Ver na tabela de usuários
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onClick={() => {
              setErr(null);
              start(async () => {
                try {
                  await adminSetBillingRequestStatus(row.id, "done");
                  router.refresh();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Falha ao atualizar");
                }
              });
            }}
          >
            Concluir
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={pending}
            onClick={() => {
              setErr(null);
              start(async () => {
                try {
                  await adminSetBillingRequestStatus(row.id, "dismissed");
                  router.refresh();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Falha ao atualizar");
                }
              });
            }}
          >
            Dispensar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AdminBillingRequestsTable({
  rows,
}: {
  rows: AdminBillingRequestRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [kindFilter, setKindFilter] = useState<string>(KIND_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [detailQuery, setDetailQuery] = useState("");

  const [manageOpen, setManageOpen] = useState(false);
  const [manageUser, setManageUser] = useState<AdminUserWithLimits | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageErr, setManageErr] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const dq = detailQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (kindFilter !== KIND_FILTER_ALL && row.kind !== kindFilter) {
        return false;
      }
      if (statusFilter !== STATUS_FILTER_ALL && row.status !== statusFilter) {
        return false;
      }
      if (dq) {
        const detail = requestDetail(row).toLowerCase();
        const phone = row.phone.toLowerCase();
        const email = (row.user_email ?? "").toLowerCase();
        if (
          !detail.includes(dq) &&
          !phone.includes(dq) &&
          !email.includes(dq) &&
          !row.user_id.toLowerCase().includes(dq)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rows, kindFilter, statusFilter, detailQuery]);

  function openManage(userId: string) {
    setManageOpen(true);
    setManageUser(null);
    setManageErr(null);
    setManageLoading(true);
    startTransition(async () => {
      try {
        const u = await fetchAdminUserManageContext(userId);
        if (!u) setManageErr("Usuário não encontrado.");
        else setManageUser(u);
      } catch (e) {
        setManageErr(e instanceof Error ? e.message : "Erro ao carregar usuário.");
      } finally {
        setManageLoading(false);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhuma solicitação registrada ainda.
      </p>
    );
  }

  const detail = (row: AdminBillingRequestRow) => requestDetail(row);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <Dialog
        open={manageOpen}
        onOpenChange={(open) => {
          if (!open) {
            setManageOpen(false);
            setManageUser(null);
            setManageErr(null);
            router.refresh();
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestão do usuário</DialogTitle>
            <DialogDescription>
              Plano, créditos extras e ações administrativas para este pedido.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {manageLoading ? (
              <p className="text-muted-foreground text-sm">Carregando…</p>
            ) : manageErr ? (
              <p className="text-destructive text-sm">{manageErr}</p>
            ) : manageUser ? (
              <AdminUserManagePanel user={manageUser} limits={manageUser.limits} />
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid w-full gap-2 sm:max-w-[11rem]">
          <Label className="text-xs">Tipo</Label>
          <Select
            value={kindFilter}
            onValueChange={(v) => setKindFilter(v ?? KIND_FILTER_ALL)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KIND_FILTER_ALL}>Todos</SelectItem>
              <SelectItem value="plan_subscribe">Assinatura</SelectItem>
              <SelectItem value="credit_purchase">Créditos</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-full gap-2 sm:max-w-[11rem]">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? STATUS_FILTER_ALL)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="done">Concluído</SelectItem>
              <SelectItem value="dismissed">Dispensado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <Label htmlFor="br-detail" className="text-xs">
            Detalhe / busca
          </Label>
          <Input
            id="br-detail"
            value={detailQuery}
            onChange={(e) => setDetailQuery(e.target.value)}
            placeholder="Filtra por resumo, e-mail, telefone ou ID…"
            className="h-9"
          />
        </div>
      </div>

      {rows.length > 0 && filteredRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum resultado com os filtros atuais.
        </p>
      ) : null}

      {filteredRows.length > 0 ? (
        <>
      <div className="grid gap-3 sm:hidden">
        {filteredRows.map((row) => (
          <Card
            key={row.id}
            data-admin-user-row={row.user_id}
            className="min-w-0 overflow-hidden"
          >
            <CardHeader className="space-y-1 pb-2">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <CardTitle className="truncate text-base whitespace-nowrap">
                    {kindLabel(row.kind)}
                  </CardTitle>
                  <CardDescription className="mt-0.5 min-w-0">
                    <Truncate title={row.user_email ?? row.user_id}>
                      {row.user_email ?? row.user_id}
                    </Truncate>
                  </CardDescription>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge
                    variant={statusVariant(row.status)}
                    className="max-w-[10rem] shrink-0 truncate whitespace-nowrap"
                  >
                    {statusLabel(row.status)}
                  </Badge>
                  {row.status === "pending" ? (
                    <RowActionsMenu row={row} onOpenManage={openManage} />
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-w-0 space-y-2 text-sm">
              <p className="text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                {shortIso(row.created_at)}
              </p>
              {row.status !== "pending" && row.handled_at ? (
                <p className="text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                  Tratada em {shortIso(row.handled_at)}
                </p>
              ) : null}
              <p className="flex min-w-0 gap-1 whitespace-nowrap">
                <span className="text-muted-foreground shrink-0">Detalhe:</span>
                <Truncate title={detail(row)} className="min-w-0 flex-1">
                  {detail(row)}
                </Truncate>
              </p>
              <Truncate title={row.phone} mono className="text-xs">
                {row.phone}
              </Truncate>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "text-xs",
                  )}
                  onClick={() => openManage(row.user_id)}
                >
                  Gerenciar plano e créditos
                </button>
                <Link
                  href={tableHref(row.user_id)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "text-xs",
                  )}
                >
                  Ver na tabela
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="-mx-1 hidden min-w-0 sm:block sm:mx-0">
        <div className="max-w-full overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <colgroup>
              <col className="w-[9rem]" />
              <col className="w-[22%]" />
              <col className="w-[7rem]" />
              <col className="w-[24%]" />
              <col className="w-[18%]" />
              <col className="w-[6.5rem]" />
              <col className="w-[8.5rem]" />
            </colgroup>
            <thead>
              <tr className="text-muted-foreground bg-muted/40 border-b text-left">
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                  Data
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                  Usuário
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                  Tipo
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                  Detalhe
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                  WhatsApp
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                  Status
                </th>
                <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} data-admin-user-row={row.user_id} className="border-b last:border-0">
                  <td className="text-muted-foreground px-3 py-2 align-middle text-xs tabular-nums">
                    <Truncate title={shortIso(row.created_at)}>
                      {shortIso(row.created_at)}
                    </Truncate>
                  </td>
                  <td className="min-w-0 px-3 py-2 align-middle">
                    <Truncate title={row.user_email ?? ""}>
                      {row.user_email ?? "-"}
                    </Truncate>
                    <Truncate
                      title={row.user_id}
                      mono
                      className="text-muted-foreground text-[10px]"
                    >
                      {row.user_id}
                    </Truncate>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                      <button
                        type="button"
                        className="text-primary text-xs font-medium hover:underline"
                        onClick={() => openManage(row.user_id)}
                      >
                        Gerenciar
                      </button>
                      <Link
                        href={tableHref(row.user_id)}
                        className="text-muted-foreground text-xs font-medium hover:underline"
                      >
                        Ver na tabela
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle whitespace-nowrap">
                    {kindLabel(row.kind)}
                  </td>
                  <td className="min-w-0 px-3 py-2 align-middle text-xs">
                    <Truncate title={detail(row)}>{detail(row)}</Truncate>
                  </td>
                  <td className="min-w-0 px-3 py-2 align-middle font-mono text-xs">
                    <Truncate title={row.phone}>{row.phone}</Truncate>
                  </td>
                  <td className="px-3 py-2 align-middle whitespace-nowrap">
                    <Badge
                      variant={statusVariant(row.status)}
                      className="max-w-full truncate font-normal"
                    >
                      {statusLabel(row.status)}
                    </Badge>
                  </td>
                  <td className="px-1 py-2 align-middle text-right">
                    <div className="flex justify-end">
                      <RowActionsMenu row={row} onOpenManage={openManage} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : null}
    </div>
  );
}
