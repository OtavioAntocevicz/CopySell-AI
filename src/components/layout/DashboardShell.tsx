"use client";

/**
 * @module src/components/layout/DashboardShell
 * Shell logado: sidebar, navegacao principal/admin, persistencia do colapso em localStorage.
 * Depende de: `UserMenu`, rotas em `src/app/(dashboard)`, icones lucide-react.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  History,
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  Shield,
  Sparkles,
  Tags,
  UserCircle,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppLogo } from "@/components/brand/AppLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "copysell-dashboard-sidebar-collapsed";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match?: (pathname: string) => boolean;
};

function defaultMatch(href: string, pathname: string) {
  if (href === "/dashboard") {
    return (
      pathname === "/dashboard" || pathname.startsWith("/dashboard/listings")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Histórico",
    icon: <History className="size-4 shrink-0" />,
    match: (p) => defaultMatch("/dashboard", p),
  },
  {
    href: "/dashboard/novo",
    label: "Novo anúncio",
    icon: <PlusCircle className="size-4 shrink-0" />,
  },
  {
    href: "/dashboard/planos",
    label: "Planos",
    icon: <CreditCard className="size-4 shrink-0" />,
  },
  {
    href: "/dashboard/solicitacoes",
    label: "Solicitações",
    icon: <MessageSquareText className="size-4 shrink-0" />,
  },
  {
    href: "/dashboard/conta",
    label: "Minha conta",
    icon: <UserCircle className="size-4 shrink-0" />,
  },
];

const adminNav: NavItem[] = [
  {
    href: "/admin",
    label: "Visão geral",
    icon: <LayoutDashboard className="size-4 shrink-0" />,
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/ia",
    label: "IA & edição",
    icon: <Sparkles className="size-4 shrink-0" />,
  },
  {
    href: "/admin/users",
    label: "Usuários",
    icon: <Users className="size-4 shrink-0" />,
  },
  {
    href: "/admin/avisos",
    label: "Avisos",
    icon: <Bell className="size-4 shrink-0" />,
  },
  {
    href: "/admin/plans",
    label: "Planos",
    icon: <Tags className="size-4 shrink-0" />,
  },
];

function NavLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const active = item.match
    ? item.match(pathname)
    : defaultMatch(item.href, pathname);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center gap-0 px-0",
      )}
    >
      {item.icon}
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

export function DashboardShell({
  children,
  email,
  isAdmin,
  usageSummary,
  usageSummaryError,
}: {
  children: React.ReactNode;
  email: string;
  isAdmin: boolean;
  usageSummary: {
    monthlyUsed: number;
    monthlyCap: number;
    extraCredits: number;
  } | null;
  usageSummaryError: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") {
        queueMicrotask(() => {
          setCollapsed(true);
        });
      }
    } catch {
      /* ignore */
    }
    queueMicrotask(() => {
      setPrefsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, prefsReady]);

  return (
    <div className="bg-background flex h-dvh min-h-0 w-full overflow-hidden">
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full min-h-0 shrink-0 flex-col border-r transition-[width] duration-200 ease-out",
          collapsed ? "w-[4.25rem]" : "w-56 sm:w-60",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b px-2",
            collapsed ? "justify-center" : "justify-between gap-1 pl-3 pr-1",
          )}
        >
          {!collapsed ? (
            <AppLogo
              href="/dashboard"
              className="text-sidebar-foreground truncate text-sm"
            />
          ) : (
            <AppLogo
              href="/dashboard"
              compact
              className="text-sidebar-foreground"
            />
          )}
          {!collapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground size-8 shrink-0"
              aria-label="Recolher menu"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="size-4" />
            </Button>
          ) : null}
        </div>

        {collapsed ? (
          <div className="flex shrink-0 justify-center py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground size-8"
              aria-label="Expandir menu"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2">
          <p
            className={cn(
              "text-muted-foreground px-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase",
              collapsed && "sr-only",
            )}
          >
            Principal
          </p>
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              pathname={pathname}
            />
          ))}

          {isAdmin ? (
            <>
              <div
                className={cn(
                  "mt-4 flex items-center gap-2 px-2.5 pb-1",
                  collapsed && "mt-3 justify-center px-0",
                )}
              >
                <Shield className="text-muted-foreground size-3.5 shrink-0" />
                <span
                  className={cn(
                    "text-muted-foreground text-[10px] font-semibold tracking-wider uppercase",
                    collapsed && "sr-only",
                  )}
                >
                  Admin
                </span>
              </div>
              {adminNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              ))}
            </>
          ) : null}
        </nav>

        <div
          className={cn(
            "min-w-0 shrink-0 space-y-2 border-t p-2",
            collapsed && "flex flex-col items-center",
          )}
        >
          <div
            className={cn(!collapsed && "px-1")}
            title={
              usageSummaryError || !usageSummary
                ? "Resumo de uso indisponível"
                : `Ciclo: ${usageSummary.monthlyUsed}/${usageSummary.monthlyCap} · Extras: ${usageSummary.extraCredits}`
            }
          >
            {collapsed ? (
              <div className="flex justify-center">
                <Badge
                  variant="secondary"
                  className="h-8 min-w-8 shrink-0 justify-center rounded-md px-1 font-mono text-[10px] leading-tight"
                >
                  {usageSummaryError || !usageSummary ? (
                    "-"
                  ) : (
                    <>
                      {usageSummary.monthlyUsed}/{usageSummary.monthlyCap}
                      <span className="text-muted-foreground block text-[9px]">
                        +{usageSummary.extraCredits}
                      </span>
                    </>
                  )}
                </Badge>
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="block w-full max-w-full truncate font-normal"
              >
                {usageSummaryError || !usageSummary ? (
                  "Uso: indisponível"
                ) : (
                  <>
                    Ciclo:{" "}
                    <span className="font-mono tabular-nums">
                      {usageSummary.monthlyUsed}/{usageSummary.monthlyCap}
                    </span>
                    <span className="text-muted-foreground"> · Extras: </span>
                    <span className="font-mono tabular-nums">
                      {usageSummary.extraCredits}
                    </span>
                  </>
                )}
              </Badge>
            )}
          </div>
          <div
            className={cn(
              !collapsed && "min-w-0 w-full overflow-hidden px-1",
              collapsed && "flex justify-center",
            )}
          >
            <UserMenu email={email} isAdmin={isAdmin} collapsed={collapsed} />
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto overscroll-contain px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
