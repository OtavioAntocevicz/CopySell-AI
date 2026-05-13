import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/server/admin/require-admin";
import { listAdminPlans } from "@/server/admin/queries";
import { resolvePlanLimits } from "@/server/usage/plan-limits";

export default async function AdminPlansPage() {
  const { supabase } = await requireAdmin();
  const plans = await listAdminPlans(supabase);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Catálogo em <code className="rounded bg-muted px-1">public.plans</code>.
        Ajuste fino de limites via SQL Editor ou migration por enquanto; UI de
        edição pode vir depois.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const lim = resolvePlanLimits(p.limits);
          return (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <CardDescription>
                  <code className="text-xs">{p.id}</code> · ordem{" "}
                  {p.display_order} · {p.active ? "ativo" : "inativo"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {p.description ?? "Sem descrição."}
                </p>
                <ul className="text-muted-foreground list-inside list-disc space-y-0.5 text-xs">
                  <li>Ciclo: {lim.monthlyGenerations} gerações</li>
                  <li>Imagens por geração: até {lim.maxImagesPerGeneration}</li>
                  <li>Imagem: até {lim.maxImageBytes} bytes</li>
                </ul>
                <pre className="bg-muted mt-2 max-h-40 overflow-auto rounded-md p-2 text-xs">
                  {JSON.stringify(p.limits, null, 2)}
                </pre>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
