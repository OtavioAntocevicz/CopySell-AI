import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listingAiOutputSchema } from "@/domains/listing/schemas";
import { resolveCategoryLabel } from "@/lib/categoryLabels";
import { listingErrorCodeLabel } from "@/lib/errors";
import { createClient } from "@/server/supabase/server";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListingDetailContent } from "@/components/features/listing/ListingDetailContent";
import {
  QUALITY_ISSUE_TAGS,
  type QualityIssueTag,
} from "@/domains/listing/quality-feedback";

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

  const sellerNotesRaw = (row as { seller_notes?: unknown }).seller_notes;
  const sellerNotesSaved =
    typeof sellerNotesRaw === "string" && sellerNotesRaw.trim()
      ? sellerNotesRaw.trim()
      : null;

  const { data: feedbackRow } = await supabase
    .from("listing_quality_feedback")
    .select("issue_tags, notes")
    .eq("listing_id", row.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const qualityFeedbackTags = ((feedbackRow?.issue_tags ?? []) as string[])
    .filter((t): t is QualityIssueTag =>
      (QUALITY_ISSUE_TAGS as readonly string[]).includes(t),
    );
  const qualityFeedbackNotes =
    typeof feedbackRow?.notes === "string" ? feedbackRow.notes : null;

  return (
    <ListingDetailContent
      listingId={row.id}
      productName={row.product_name}
      categorySlug={row.category}
      categoryLabel={categoryPt}
      createdAtLabel={new Date(row.created_at).toLocaleString("pt-BR")}
      sellerNotes={sellerNotesSaved}
      initialOutput={parsed.data}
      qualityFeedbackTags={qualityFeedbackTags}
      qualityFeedbackNotes={qualityFeedbackNotes}
    />
  );
}
