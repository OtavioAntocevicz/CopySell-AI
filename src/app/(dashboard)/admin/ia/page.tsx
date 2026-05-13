import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/server/admin/require-admin";
import { computeBehaviorInsights } from "@/server/analytics/behavior-insights";

function RankTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { term: string; count: number }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.term} className="border-b last:border-0">
                  <td className="max-w-[220px] truncate py-1.5 pr-2" title={r.term}>
                    {r.term}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminIaPage() {
  const { supabase } = await requireAdmin();
  const insights = await computeBehaviorInsights(supabase);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Janela: últimos {insights.windowDays} dias · Amostra: até{" "}
        {insights.sampleEvents} eventos recentes. Métricas derivadas de{" "}
        <code className="rounded bg-muted px-1">listing_behavior_events</code>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de edição no título</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {insights.titleEditRate != null
                ? `${(insights.titleEditRate * 100).toFixed(1)}%`
                : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Com base em <code className="rounded bg-muted px-1">titleChanged</code>{" "}
            nos eventos com métrica.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Listings com edição / concluídos</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {insights.saveAfterGenerationRate != null
                ? `${(insights.saveAfterGenerationRate * 100).toFixed(1)}%`
                : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Distinct listings com evento de edição ÷ listings concluídos no
            período (proxy operacional).
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RankTable
          title="Campos mais editados"
          rows={insights.topEditedFields}
          empty="Sem dados."
        />
        <RankTable
          title="Keywords mais removidas"
          rows={insights.topKeywordsRemoved}
          empty="Sem dados."
        />
        <RankTable
          title="Keywords mais adicionadas"
          rows={insights.topKeywordsAdded}
          empty="Sem dados."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por categoria</CardTitle>
          <CardDescription>
            Eventos de edição e média de campos alterados por evento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.categoryAggs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem dados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="py-2 pr-4 font-medium">Categoria</th>
                    <th className="py-2 pr-4 font-medium">Eventos</th>
                    <th className="py-2 font-medium">Média campos/evento</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.categoryAggs.map((c) => (
                    <tr key={c.category} className="border-b last:border-0">
                      <td className="py-2 pr-4">{c.category}</td>
                      <td className="py-2 pr-4 tabular-nums">{c.eventCount}</td>
                      <td className="py-2 tabular-nums">
                        {c.avgFieldsEdited.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Claims removidos, bullets NLP finos, etc. exigem schema adicional nos
        eventos - deixado de fora neste MVP.
      </p>
    </div>
  );
}
