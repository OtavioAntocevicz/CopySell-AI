import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/server/admin/require-admin";
import { getAdminOverviewStats } from "@/server/admin/queries";
import { planDisplayLabel } from "@/server/billing/plan-config";
import { isPlanId } from "@/server/billing/plans";
import {
  isSellerSegment,
  sellerSegmentLabel,
} from "@/lib/profile/seller-segment";

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="text-muted-foreground text-xs">{hint}</CardContent>
      ) : null}
    </Card>
  );
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  const stats = await getAdminOverviewStats(supabase);

  const planRows = Object.entries(stats.usersByPlan).sort(
    (a, b) => b[1] - a[1],
  );

  const segmentOrder = ["b2b", "b2c", "both", "unknown"] as const;
  const segmentRows = Object.entries(stats.usersBySellerSegment).sort(
    ([ka], [kb]) => {
      const ia = segmentOrder.indexOf(ka as (typeof segmentOrder)[number]);
      const ib = segmentOrder.indexOf(kb as (typeof segmentOrder)[number]);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return kb.localeCompare(ka);
    },
  );

  function segmentTableLabel(key: string): string {
    if (key === "unknown") return "Não informado";
    if (isSellerSegment(key)) return sellerSegmentLabel(key);
    return key;
  }

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-sm">
        {stats.usagePeriodNote}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Usuários (perfis)" value={stats.totalUsers} />
        <StatCard
          title="Usuários ativos (30d)"
          value={stats.activeUsers30d}
          hint="Com pelo menos um listing criado nos últimos 30 dias."
        />
        <StatCard
          title="Gerações concluídas hoje (UTC)"
          value={stats.generationsTodayUtc}
        />
        <StatCard
          title="Listings criados hoje (UTC)"
          value={stats.listingsCreatedTodayUtc}
        />
        <StatCard
          title="Média de campos editados / save (30d)"
          value={
            stats.avgFieldsEditedLast30d != null
              ? stats.avgFieldsEditedLast30d.toFixed(2)
              : "-"
          }
          hint="Apenas eventos com métricas válidas (amostra até 5k eventos)."
        />
        <StatCard
          title="Tempo médio geração → save (30d)"
          value={
            stats.avgGenerationToSaveMsLast30d != null
              ? `${(stats.avgGenerationToSaveMsLast30d / 1000).toFixed(1)} s`
              : "-"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consumo por plano</CardTitle>
          <CardDescription>
            Usuários cadastrados e gerações no ciclo atual (por âncora de assinatura).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">Plano</th>
                  <th className="py-2 pr-4 font-medium">Usuários</th>
                  <th className="py-2 font-medium">Gerações (ciclo atual)</th>
                </tr>
              </thead>
              <tbody>
                {planRows.map(([planId, userCount]) => (
                  <tr key={planId} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {isPlanId(planId)
                        ? planDisplayLabel(planId)
                        : planId}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">{userCount}</td>
                    <td className="py-2 tabular-nums">
                      {stats.monthlyGenerationsByPlan[planId] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadastros por perfil de venda</CardTitle>
          <CardDescription>
            Autodeclarado no cadastro ou na página Minha conta. Útil para priorizar
            roadmap e comunicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">Perfil</th>
                  <th className="py-2 font-medium">Usuários</th>
                </tr>
              </thead>
              <tbody>
                {segmentRows.map(([segKey, count]) => (
                  <tr key={segKey} className="border-b last:border-0">
                    <td className="py-2 pr-4">{segmentTableLabel(segKey)}</td>
                    <td className="py-2 tabular-nums">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
