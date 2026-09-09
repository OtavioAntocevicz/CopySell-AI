import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BenchmarkGuideCard } from "@/components/features/listing/BenchmarkGuideCard";
import { ListingForm } from "@/components/features/listing/ListingForm";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { createClient } from "@/server/supabase/server";
import { getUsageSummaryForUser } from "@/server/usage/usage-service";

function formatBytes(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function NovoAnuncioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usage = await getUsageSummaryForUser(supabase, user.id);
  const monthlyUsed = usage?.monthlyUsed ?? 0;
  const monthlyCap = usage?.monthlyCap ?? 0;
  const extraCredits = usage?.extraCredits ?? 0;
  const maxImageBytes = usage?.maxImageBytes ?? 2097152;
  const maxImages = usage?.maxImagesPerGeneration ?? 1;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("blocked_at, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  const blocked = Boolean(profileRow?.blocked_at);
  const subscriptionOk = profileRow?.subscription_status === "active";
  const atMonthlyLimit = monthlyCap > 0 && monthlyUsed >= monthlyCap;
  const canUseExtraCredits = atMonthlyLimit && extraCredits > 0;
  const canUseCreditsWhenInactive =
    !subscriptionOk && extraCredits > 0 && !blocked;

  const disabled =
    blocked ||
    (!subscriptionOk && extraCredits <= 0) ||
    (atMonthlyLimit && extraCredits <= 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Novo anúncio</h1>
          <p className="text-muted-foreground text-sm">
            Escolha o canal (Mercado Livre ou loja própria), envie foto(s) e dados
            básicos — a IA gera copy otimizada para cada destino.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/planos"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Ver planos
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Voltar ao histórico
          </Link>
        </div>
      </div>

      {blocked ? (
        <Alert variant="destructive">
          <AlertTitle>Conta suspensa</AlertTitle>
          <AlertDescription>
            Entre em contato com o suporte para regularizar o acesso.
          </AlertDescription>
        </Alert>
      ) : null}

      {!blocked && !subscriptionOk && !canUseCreditsWhenInactive ? (
        <Alert variant="destructive">
          <AlertTitle>Assinatura inativa</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Sua conta não está elegível para novas gerações (status:{" "}
              <span className="font-medium">
                {profileRow?.subscription_status ?? "-"}
              </span>
              ). Escolha um plano pago ou compre créditos extras para continuar.
            </p>
            <Link
              href="/dashboard/planos"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Ver planos
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {canUseCreditsWhenInactive ? (
        <Alert>
          <AlertTitle>Usando créditos extras</AlertTitle>
          <AlertDescription>
            Sua assinatura está inativa, mas você tem{" "}
            <span className="font-medium">{extraCredits}</span> crédito(s) extra(s)
            disponível(is) para gerar anúncios.
          </AlertDescription>
        </Alert>
      ) : null}

      {subscriptionOk && atMonthlyLimit && !canUseExtraCredits ? (
        <Alert variant="destructive">
          <AlertTitle>Limite do ciclo atingido</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Você usou {monthlyUsed}/{monthlyCap} gerações neste ciclo de
              faturamento. Renova em{" "}
              {usage ? formatDate(usage.periodEndsAt) : "-"} ou faça upgrade.
            </p>
            <Link
              href="/dashboard/planos"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Ver planos
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {canUseExtraCredits ? (
        <Alert>
          <AlertTitle>Limite do plano atingido — créditos extras</AlertTitle>
          <AlertDescription>
            Você usou {monthlyUsed}/{monthlyCap} gerações do plano neste ciclo.
            Ainda restam{" "}
            <span className="font-medium">{extraCredits}</span> crédito(s) extra(s)
            (não expiram) para continuar gerando.
          </AlertDescription>
        </Alert>
      ) : null}

      {!disabled ? (
        <p className="text-muted-foreground text-sm">
          Uso no ciclo:{" "}
          <span className="text-foreground font-medium">
            {monthlyUsed}/{monthlyCap}
          </span>{" "}
          gerações
          {extraCredits > 0 ? (
            <>
              {" "}
              · <span className="font-medium">{extraCredits}</span> crédito(s)
              extra(s)
            </>
          ) : null}{" "}
          · até {maxImages} imagem(ns) por geração · imagem até{" "}
          {formatBytes(maxImageBytes)} · renovação:{" "}
          {usage ? formatDate(usage.periodEndsAt) : "-"}.
        </p>
      ) : null}

      <BenchmarkGuideCard />

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
          <CardDescription>
            Formatos: JPEG, PNG ou WebP até {formatBytes(maxImageBytes)} cada.
            {maxImages > 1
              ? ` Envie até ${maxImages} imagens por geração.`
              : " Uma imagem por geração no seu plano."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListingForm disabled={disabled} maxImages={maxImages} />
        </CardContent>
      </Card>
    </div>
  );
}
