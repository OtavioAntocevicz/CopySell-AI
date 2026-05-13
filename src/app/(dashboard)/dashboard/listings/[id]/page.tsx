import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listingAiOutputSchema } from "@/domains/listing/schemas";
import { resolveCategoryLabel } from "@/lib/categoryLabels";
import { listingErrorCodeLabel } from "@/lib/errors";
import { createClient } from "@/server/supabase/server";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CopyBlock,
  ListingExportToolbar,
} from "@/components/features/listing/ListingExportToolbar";

type PageProps = { params: Promise<{ id: string }> };

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!row) notFound();

  const categoryPt = resolveCategoryLabel(row.category);

  if (row.status !== "completed") {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← Voltar
        </Link>
        <Alert variant="destructive">
          <AlertTitle>Geração não concluída</AlertTitle>
          <AlertDescription>
            Motivo: {listingErrorCodeLabel(row.error_code)}. Tente gerar
            novamente em{" "}
            <Link href="/dashboard/novo" className="underline">
              Novo anúncio
            </Link>
            .
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const parsed = listingAiOutputSchema.safeParse(row.outputs);
  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← Voltar
        </Link>
        <Alert variant="destructive">
          <AlertTitle>Dados inválidos</AlertTitle>
          <AlertDescription>
            Não foi possível ler o resultado salvo. ID: {row.id}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const output = parsed.data;

  const sellerNotesRaw = (row as { seller_notes?: unknown }).seller_notes;
  const sellerNotesSaved =
    typeof sellerNotesRaw === "string" && sellerNotesRaw.trim()
      ? sellerNotesRaw.trim()
      : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mb-3 inline-flex",
            )}
          >
            ← Histórico
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{output.title}</h1>
          <p className="text-muted-foreground text-sm">
            {row.product_name} · {categoryPt} ·{" "}
            {new Date(row.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <ListingExportToolbar
          productName={row.product_name}
          categorySlug={row.category}
          categoryLabel={categoryPt}
          output={output}
        />
      </div>

      {sellerNotesSaved ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Seus detalhes enviados na geração</CardTitle>
            <CardDescription>
              Texto que você informou em &quot;Novo anúncio&quot; como contexto
              extra para a IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">
              {sellerNotesSaved}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Título</CardTitle>
            <CardDescription>Otimizado para até 60 caracteres na vitrine.</CardDescription>
          </CardHeader>
          <CardContent>
            <CopyBlock label="Título" text={output.title} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descrição curta</CardTitle>
          </CardHeader>
          <CardContent>
            <CopyBlock label="Descrição curta" text={output.short_description} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palavras-chave</CardTitle>
          </CardHeader>
          <CardContent>
            <CopyBlock
              label="Palavras-chave"
              text={output.keywords.join(", ")}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Descrição longa</CardTitle>
          </CardHeader>
          <CardContent>
            <CopyBlock label="Descrição longa" text={output.long_description} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bullets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {output.bullets.map((b, i) => (
              <CopyBlock key={i} label={`Bullet ${i + 1}`} text={b} />
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sugestões SEO</CardTitle>
            <CardDescription>Orientações para visibilidade no marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
            <CopyBlock
              label="Sugestões SEO"
              text={output.seo_suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
