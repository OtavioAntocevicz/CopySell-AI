"use client";

/**
 * @module src/components/admin/AdminUserManageDialog
 * Dialog que encapsula `AdminUserManagePanel` a partir do menu de acoes na tabela de usuarios.
 */
import { MoreVertical } from "lucide-react";

import { AdminUserManagePanel } from "@/components/admin/AdminUserManagePanel";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import type { AdminUserRow } from "@/server/admin/queries";
import type { PlanLimitsResolved } from "@/server/usage/plan-limits";

export function AdminUserManageDialog({
  user,
  limits,
}: {
  user: AdminUserRow;
  limits: PlanLimitsResolved;
}) {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "text-muted-foreground hover:text-foreground shrink-0",
        )}
        aria-label={`Gerenciar ${user.display_name ?? user.email ?? "usuário"}`}
      >
        <MoreVertical className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.display_name ?? "Sem nome"}</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">{user.email ?? "-"}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <AdminUserManagePanel user={user} limits={limits} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
