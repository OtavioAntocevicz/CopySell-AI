import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { requireAdmin } from "@/server/admin/require-admin";
import { listAdminPlans, listAdminUsers } from "@/server/admin/queries";
import { resolvePlanLimits } from "@/server/usage/plan-limits";

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();
  const [users, plans] = await Promise.all([
    listAdminUsers(supabase),
    listAdminPlans(supabase),
  ]);

  const limitsByPlan = new Map(
    plans.map((p) => [p.id, resolvePlanLimits(p.limits)]),
  );

  const usersWithLimits = users.map((u) => ({
    ...u,
    limits: limitsByPlan.get(u.plan_id) ?? resolvePlanLimits({}),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Consumo no ciclo atual de cada usuário (âncora de assinatura), plano e
            status. Use os filtros e a busca para localizar contas; em telas menores
            a lista vira cards. O menu ao final da linha (ou no card) abre a gestão
            administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm">Carregando tabela…</p>
            }
          >
            <AdminUsersTable users={usersWithLimits} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
