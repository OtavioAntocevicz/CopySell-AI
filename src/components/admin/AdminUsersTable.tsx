"use client";

/**
 * @module src/components/admin/AdminUsersTable
 * Lista usuarios (cards mobile / tabela desktop), filtros, deep links `?user=` e `?highlight=`, dialog de gestao.
 * Props: `users` com limites resolvidos por plano.
 */
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminUserManageDialog } from "@/components/admin/AdminUserManageDialog";
import { AdminUserManagePanel } from "@/components/admin/AdminUserManagePanel";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  isSellerSegment,
  sellerSegmentLabel,
} from "@/lib/profile/seller-segment";
import type { AdminUserWithLimits } from "@/server/admin/queries";

const FILTER_ALL = "all";
const BLOCKED_FILTER_BLOCKED = "blocked";
const BLOCKED_FILTER_NOT = "not_blocked";

function shortIso(iso: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

function AdminUserUsageBar({ used, cap }: { used: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <div className="w-full min-w-[100px] max-w-[200px] space-y-1">
      <div className="text-muted-foreground flex justify-between gap-2 text-xs tabular-nums">
        <span>{used}</span>
        <span>/ {cap}</span>
      </div>
      <div
        className="bg-muted h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-label={`Uso ${used} de ${cap} gerações no ciclo`}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SubscriptionCell({ u }: { u: AdminUserWithLimits }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant="secondary" className="font-normal">
        {u.subscription_status}
      </Badge>
      {u.billing_interval ? (
        <span className="text-muted-foreground text-xs">
          ({u.billing_interval})
        </span>
      ) : null}
    </div>
  );
}

function BlockCell({ blocked }: { blocked: boolean }) {
  return blocked ? (
    <Badge variant="destructive">sim</Badge>
  ) : (
    <Badge variant="outline">não</Badge>
  );
}

function SegmentBadge({ segment }: { segment: string | null }) {
  if (!segment || !isSellerSegment(segment)) {
    return (
      <span className="text-muted-foreground max-w-[140px] truncate text-xs">
        -
      </span>
    );
  }
  return (
    <Badge variant="outline" className="max-w-[160px] truncate font-normal">
      {sellerSegmentLabel(segment)}
    </Badge>
  );
}

function userSearchBlob(u: AdminUserWithLimits): string {
  const parts: (string | null | undefined)[] = [
    u.id,
    u.email,
    u.display_name,
    u.first_name,
    u.last_name,
    u.company_name,
    u.phone,
    u.plan_id,
    u.role,
    u.subscription_status,
    u.seller_segment,
    u.billing_interval,
    u.usagePeriodKey,
    shortIso(u.usagePeriodEndsAt),
    String(u.extra_credits_balance),
    String(u.monthlyGenerationsUsed),
  ];
  if (u.seller_segment && isSellerSegment(u.seller_segment)) {
    parts.push(sellerSegmentLabel(u.seller_segment));
  }
  return parts
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .join(" ")
    .toLowerCase();
}

function matchesSearch(u: AdminUserWithLimits, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const hay = userSearchBlob(u);
  return hay.includes(t);
}

export function AdminUsersTable({ users }: { users: AdminUserWithLimits[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const paramsString = params.toString();
  const userFromUrl = params.get("user");
  const highlightId = params.get("highlight");
  const [ringUserId, setRingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(FILTER_ALL);
  const [planFilter, setPlanFilter] = useState(FILTER_ALL);
  const [subFilter, setSubFilter] = useState(FILTER_ALL);
  const [blockedFilter, setBlockedFilter] = useState(FILTER_ALL);

  const uniquePlans = useMemo(
    () => [...new Set(users.map((u) => u.plan_id))].sort(),
    [users],
  );
  const uniqueRoles = useMemo(
    () => [...new Set(users.map((u) => u.role))].sort(),
    [users],
  );
  const uniqueSubs = useMemo(
    () => [...new Set(users.map((u) => u.subscription_status))].sort(),
    [users],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!matchesSearch(u, searchQuery)) return false;
      if (roleFilter !== FILTER_ALL && u.role !== roleFilter) return false;
      if (planFilter !== FILTER_ALL && u.plan_id !== planFilter) return false;
      if (subFilter !== FILTER_ALL && u.subscription_status !== subFilter) {
        return false;
      }
      if (blockedFilter === BLOCKED_FILTER_BLOCKED && !u.blocked_at) {
        return false;
      }
      if (blockedFilter === BLOCKED_FILTER_NOT && u.blocked_at) return false;
      return true;
    });
  }, [users, searchQuery, roleFilter, planFilter, subFilter, blockedFilter]);

  const highlightHidden =
    Boolean(highlightId) &&
    users.some((u) => u.id === highlightId) &&
    !filteredUsers.some((u) => u.id === highlightId);

  function clearFilters() {
    setSearchQuery("");
    setRoleFilter(FILTER_ALL);
    setPlanFilter(FILTER_ALL);
    setSubFilter(FILTER_ALL);
    setBlockedFilter(FILTER_ALL);
  }

  useEffect(() => {
    if (!highlightId || !users.some((u) => u.id === highlightId)) return;

    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-admin-user-row="${CSS.escape(highlightId)}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setRingUserId(highlightId);

      const next = new URLSearchParams(paramsString);
      next.delete("highlight");
      const qs = next.toString();
      window.setTimeout(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, 400);
    });

    const clearRing = window.setTimeout(() => setRingUserId(null), 2800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(clearRing);
    };
  }, [highlightId, users, pathname, router, paramsString]);

  const urlUser =
    userFromUrl && users.some((u) => u.id === userFromUrl)
      ? users.find((u) => u.id === userFromUrl)!
      : null;

  return (
    <>
      {urlUser ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              router.replace(pathname);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{urlUser.display_name ?? "Sem nome"}</DialogTitle>
              <DialogDescription className="space-y-1">
                <span className="block">{urlUser.email ?? "-"}</span>
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <AdminUserManagePanel user={urlUser} limits={urlUser.limits} />
            </DialogBody>
          </DialogContent>
        </Dialog>
      ) : null}

      <div className="w-full min-w-0 max-w-full space-y-4">
        {highlightHidden ? (
          <p className="bg-muted/50 text-muted-foreground rounded-md border px-3 py-2 text-sm">
            O usuário destacado não aparece com os filtros atuais.{" "}
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "link", className: "h-auto p-0" }),
              )}
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </p>
        ) : null}

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="grid min-w-0 flex-1 gap-2 lg:min-w-[min(100%,14rem)] lg:max-w-md">
            <Label htmlFor="admin-users-search" className="text-xs">
              Busca
            </Label>
            <Input
              id="admin-users-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome, e-mail, id, plano, status, telefone…"
              className="h-9"
            />
          </div>
          <div className="grid w-full gap-2 sm:max-w-[11rem]">
            <Label className="text-xs">Papel</Label>
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v ?? FILTER_ALL)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                {uniqueRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full gap-2 sm:max-w-[11rem]">
            <Label className="text-xs">Plano</Label>
            <Select
              value={planFilter}
              onValueChange={(v) => setPlanFilter(v ?? FILTER_ALL)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                {uniquePlans.map((pid) => (
                  <SelectItem key={pid} value={pid}>
                    {pid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full gap-2 sm:max-w-[12rem]">
            <Label className="text-xs">Assinatura</Label>
            <Select
              value={subFilter}
              onValueChange={(v) => setSubFilter(v ?? FILTER_ALL)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                {uniqueSubs.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full gap-2 sm:max-w-[11rem]">
            <Label className="text-xs">Bloqueio</Label>
            <Select
              value={blockedFilter}
              onValueChange={(v) =>
                setBlockedFilter(v ?? FILTER_ALL)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Bloqueio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                <SelectItem value={BLOCKED_FILTER_BLOCKED}>
                  Bloqueado
                </SelectItem>
                <SelectItem value={BLOCKED_FILTER_NOT}>Não bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground w-full text-xs lg:ml-auto lg:w-auto lg:shrink-0 lg:self-end lg:pb-2 lg:text-right">
            Mostrando {filteredUsers.length} de {users.length}
          </p>
        </div>

        {users.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum usuário.</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum resultado com os filtros atuais.{" "}
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "link", className: "h-auto p-0" }),
              )}
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </p>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {filteredUsers.map((u) => {
                const blocked = Boolean(u.blocked_at);
                return (
                  <Card
                    key={u.id}
                    data-admin-user-row={u.id}
                    className={cn(
                      ringUserId === u.id &&
                        "ring-primary/50 ring-2 ring-offset-2 ring-offset-background",
                    )}
                  >
                    <CardHeader className="space-y-1 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">
                            {u.display_name ?? "-"}
                          </CardTitle>
                          <CardDescription className="truncate text-xs">
                            {u.email ?? "-"}
                          </CardDescription>
                          <p
                            className="text-muted-foreground mt-1 truncate font-mono text-[10px]"
                            title={u.id}
                          >
                            {u.id}
                          </p>
                          {u.phone ? (
                            <p
                              className="text-muted-foreground truncate text-xs tabular-nums"
                              title={u.phone}
                            >
                              {u.phone}
                            </p>
                          ) : null}
                        </div>
                        <AdminUserManageDialog user={u} limits={u.limits} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={u.role === "admin" ? "default" : "secondary"}
                        >
                          {u.role}
                        </Badge>
                        <SegmentBadge segment={u.seller_segment} />
                        <SubscriptionCell u={u} />
                        <BlockCell blocked={blocked} />
                      </div>
                      <div className="text-muted-foreground flex flex-wrap justify-between gap-2 text-xs">
                        <span>Ciclo até {shortIso(u.usagePeriodEndsAt)}</span>
                        <span className="font-mono tabular-nums">
                          Plano: {u.plan_id}
                        </span>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">
                          Uso no ciclo
                        </p>
                        <AdminUserUsageBar
                          used={u.monthlyGenerationsUsed}
                          cap={u.limits.monthlyGenerations}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="-mx-1 hidden min-w-0 lg:block lg:mx-0">
              <div className="max-w-full overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[900px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                    <col className="w-[8%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[9%]" />
                    <col className="w-[17%]" />
                    <col className="w-[6%]" />
                    <col className="w-[2rem]" />
                  </colgroup>
                  <thead>
                    <tr className="text-muted-foreground bg-muted/40 border-b text-left">
                      <th className="bg-muted/40 sticky left-0 z-[1] border-r border-border/70 px-3 py-2.5 font-medium shadow-[4px_0_12px_-8px_rgba(0,0,0,0.25)]">
                        Nome
                      </th>
                      <th className="px-3 py-2.5 font-medium">Email</th>
                      <th className="px-3 py-2.5 font-medium">Papel</th>
                      <th className="px-3 py-2.5 font-medium">Perfil de venda</th>
                      <th className="px-3 py-2.5 font-medium">Assinatura</th>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                        Fim ciclo
                      </th>
                      <th className="px-3 py-2.5 font-medium">Uso</th>
                      <th className="px-3 py-2.5 font-medium">Bloq.</th>
                      <th className="bg-muted/40 sticky right-0 z-[1] w-12 border-l border-border/70 px-2 py-2.5 text-right font-medium shadow-[-4px_0_12px_-8px_rgba(0,0,0,0.25)]">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const blocked = Boolean(u.blocked_at);
                      const rowHighlight =
                        ringUserId === u.id ? "bg-primary/5" : "";
                      return (
                        <tr
                          key={u.id}
                          data-admin-user-row={u.id}
                          className={cn(
                            "border-b last:border-0",
                            ringUserId === u.id &&
                              "ring-primary/40 ring-1 ring-inset",
                          )}
                        >
                          <td
                            title={u.display_name ?? ""}
                            className={cn(
                              "sticky left-0 z-[1] max-w-0 truncate border-r border-border/70 px-3 py-2.5 align-middle shadow-[4px_0_12px_-8px_rgba(0,0,0,0.2)]",
                              rowHighlight ? "bg-primary/5" : "bg-card",
                            )}
                          >
                            {u.display_name ?? "-"}
                          </td>
                          <td
                            className="text-muted-foreground max-w-0 truncate px-3 py-2.5 align-middle"
                            title={u.email ?? ""}
                          >
                            {u.email ?? "-"}
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <Badge
                              variant={
                                u.role === "admin" ? "default" : "secondary"
                              }
                              className="font-normal"
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="max-w-0 px-3 py-2.5 align-middle">
                            <SegmentBadge segment={u.seller_segment} />
                          </td>
                          <td className="min-w-0 px-3 py-2.5 align-middle">
                            <SubscriptionCell u={u} />
                          </td>
                          <td className="text-muted-foreground px-3 py-2.5 align-middle text-xs whitespace-nowrap tabular-nums">
                            {shortIso(u.usagePeriodEndsAt)}
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <AdminUserUsageBar
                              used={u.monthlyGenerationsUsed}
                              cap={u.limits.monthlyGenerations}
                            />
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <BlockCell blocked={blocked} />
                          </td>
                          <td
                            className={cn(
                              "sticky right-0 z-[1] border-l border-border/70 px-2 py-2.5 text-right align-middle shadow-[-4px_0_12px_-8px_rgba(0,0,0,0.2)]",
                              rowHighlight ? "bg-primary/5" : "bg-card",
                            )}
                          >
                            <AdminUserManageDialog user={u} limits={u.limits} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
