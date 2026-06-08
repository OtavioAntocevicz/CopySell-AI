import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase/server";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppLogo } from "@/components/brand/AppLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LandingPlansSection } from "@/components/marketing/LandingPlansSection";
import { loadPricingPlanRows } from "@/server/billing/load-pricing-plans";

export const metadata = {
  title: "CopySell AI - Anúncios para marketplaces com IA",
  description:
    "Gere título, descrições, bullets e palavras-chave otimizados para marketplaces a partir da foto do produto.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const planRows = await loadPricingPlanRows();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <AppLogo />
          <div className="flex gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Entrar
            </Link>
            <Link href="/signup" className={cn(buttonVariants())}>
              Começar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-16">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            IA especializada em anúncios para marketplaces
          </h1>
          <p className="text-muted-foreground text-lg">
            Envie a imagem do produto, nome e categoria. Receba título, textos,
            bullets e palavras-chave pensados para SEO interno, clareza e
            conversão - não um gerador genérico de texto.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Multimodal</CardTitle>
              <CardDescription>
                A IA analisa a foto e enriquece o contexto automaticamente.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Foco em marketplaces</CardTitle>
              <CardDescription>
                Regras de título, bullets e SEO pensadas para vitrines de e-commerce.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Exportação</CardTitle>
              <CardDescription>
                Copiar tudo ou CSV para encaixar no seu fluxo de publicação.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <LandingPlansSection plans={planRows} />
      </main>

      <SiteFooter />
    </div>
  );
}
