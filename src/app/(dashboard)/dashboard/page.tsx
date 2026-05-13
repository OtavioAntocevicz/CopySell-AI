import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { describeSupabaseQueryError } from "@/lib/supabase/errors";
import { resolveCategoryLabel } from "@/lib/categoryLabels";
import { listingErrorCodeLabel } from "@/lib/errors";
import { logServerError } from "@/lib/logger";
import { ListingHistoryRowMenu } from "@/components/features/listing/ListingHistoryRowMenu";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows, error } = await supabase
    .from("listings")
    .select("id, created_at, status, product_name, category, error_code, outputs")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logServerError("dashboard_listings_query", {
      code: error.code,
      message: error.message,
      userId: user.id,
    });
    const hint = describeSupabaseQueryError("listings", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground text-sm">
            Anúncios gerados para marketplaces com IA multimodal.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o histórico</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{hint}</p>
            <p className="text-xs">
              No Supabase: SQL Editor → cole o conteúdo de{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                supabase/migrations/20260512150000_copy_sell_schema.sql
              </code>{" "}
              e execute.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground text-sm">
            Anúncios gerados para marketplaces com IA multimodal.
          </p>
        </div>
        <Link
          href="/dashboard/novo"
          className={cn(buttonVariants())}
        >
          Novo anúncio
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos resultados</CardTitle>
          <CardDescription>
            Somente você enxerga seus anúncios (políticas RLS no Supabase).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!rows?.length ? (
            <p className="text-muted-foreground text-sm">
              Nenhum anúncio ainda.{" "}
              <Link href="/dashboard/novo" className="underline">
                Gerar o primeiro
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{row.product_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(row.created_at).toLocaleString("pt-BR")} ·{" "}
                      {row.category}
                    </p>
                  </div>
                  <Badge
                    variant={row.status === "completed" ? "default" : "destructive"}
                  >
                    {row.status === "completed" ? "Concluído" : "Falhou"}
                  </Badge>
                  <div className="flex flex-wrap items-center gap-2">
                    {row.status === "completed" ? (
                      <Link
                        href={`/dashboard/listings/${row.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        Abrir
                      </Link>
                    ) : (
                      <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                        {listingErrorCodeLabel(row.error_code)}
                      </span>
                    )}
                    <ListingHistoryRowMenu
                      listingId={row.id as string}
                      productName={row.product_name as string}
                      status={row.status as string}
                      outputs={row.outputs}
                      categoryLabel={resolveCategoryLabel(
                        row.category as string,
                      )}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
