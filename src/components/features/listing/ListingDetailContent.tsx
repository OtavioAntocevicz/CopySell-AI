"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { ListingAiOutput } from "@/domains/listing/schemas";
import { saveListingOutputAction } from "@/app/(dashboard)/dashboard/listings/[id]/actions";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CopyBlock,
  ListingExportToolbar,
} from "@/components/features/listing/ListingExportToolbar";
import { ListingQualityFeedback } from "@/components/features/listing/ListingQualityFeedback";
import { ListingStoreMetaPanel } from "@/components/features/listing/ListingStoreMetaPanel";
import { ProductImageGallery } from "@/components/features/listing/ProductImageGallery";
import type { QualityIssueTag } from "@/domains/listing/quality-feedback";
import type { MarketplaceId } from "@/domains/marketplace/types";
import { marketplaceLabel } from "@/domains/marketplace/types";
import { Badge } from "@/components/ui/badge";

type Props = {
  listingId: string;
  marketplace: MarketplaceId;
  productName: string;
  categorySlug: string;
  categoryLabel: string;
  createdAtLabel: string;
  sellerNotes: string | null;
  imageUrls: string[];
  initialOutput: ListingAiOutput;
  qualityFeedbackTags?: QualityIssueTag[];
  qualityFeedbackNotes?: string | null;
};

function linesFromArray(items: string[]): string {
  return items.join("\n");
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseKeywords(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

type Draft = {
  title: string;
  short_description: string;
  long_description: string;
  bulletsText: string;
  keywordsText: string;
  seoSuggestionsText: string;
};

function draftFromOutput(output: ListingAiOutput): Draft {
  return {
    title: output.title,
    short_description: output.short_description,
    long_description: output.long_description,
    bulletsText: linesFromArray(output.bullets),
    keywordsText: output.keywords.join(", "),
    seoSuggestionsText: linesFromArray(output.seo_suggestions),
  };
}

function outputFromDraft(
  draft: Draft,
  exportMeta?: ListingAiOutput["export_meta"],
): ListingAiOutput {
  return {
    title: draft.title.trim(),
    short_description: draft.short_description.trim(),
    long_description: draft.long_description.trim(),
    bullets: parseLines(draft.bulletsText),
    keywords: parseKeywords(draft.keywordsText),
    seo_suggestions: parseLines(draft.seoSuggestionsText),
    export_meta: exportMeta,
  };
}

export function ListingDetailContent({
  listingId,
  marketplace,
  productName,
  categorySlug,
  categoryLabel,
  createdAtLabel,
  sellerNotes,
  imageUrls,
  initialOutput,
  qualityFeedbackTags = [],
  qualityFeedbackNotes = null,
}: Props) {
  const [output, setOutput] = useState(initialOutput);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFromOutput(initialOutput));
  const [pending, setPending] = useState(false);
  const editStartedAtRef = useRef<number | null>(null);

  const displayTitle = useMemo(() => output.title, [output.title]);

  function startEditing() {
    setDraft(draftFromOutput(output));
    editStartedAtRef.current = Date.now();
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(draftFromOutput(output));
    editStartedAtRef.current = null;
    setEditing(false);
  }

  async function handleSave() {
    setPending(true);
    const nextOutput = outputFromDraft(draft, output.export_meta);
    const editDurationMs =
      editStartedAtRef.current != null
        ? Date.now() - editStartedAtRef.current
        : null;

    const result = await saveListingOutputAction(
      listingId,
      nextOutput,
      editDurationMs,
    );

    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setOutput(result.output);
    setDraft(draftFromOutput(result.output));
    editStartedAtRef.current = null;
    setEditing(false);
    toast.success("Alterações salvas");
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">{displayTitle}</h1>
          <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{marketplaceLabel(marketplace)}</Badge>
            <span>
              {productName} · {categoryLabel} · {createdAtLabel}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={pending}
              >
                <X className="mr-2 size-4" />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSave()}
                disabled={pending}
              >
                {pending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="mr-2 size-4" />
              Editar
            </Button>
          )}
          <ListingExportToolbar
            marketplace={marketplace}
            productName={productName}
            categorySlug={categorySlug}
            categoryLabel={categoryLabel}
            output={output}
          />
        </div>
      </div>

      <ProductImageGallery imageUrls={imageUrls} productName={productName} />

      {marketplace === "loja_propria" && output.export_meta ? (
        <ListingStoreMetaPanel storeMeta={output.export_meta} />
      ) : null}

      {sellerNotes ? (
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
              {sellerNotes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {editing ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Título</CardTitle>
              <CardDescription>Até 120 caracteres no editor.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="title" className="sr-only">
                Título
              </Label>
              <Textarea
                id="title"
                value={draft.title}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                rows={2}
                disabled={pending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Descrição curta</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draft.short_description}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    short_description: e.target.value,
                  }))
                }
                rows={5}
                disabled={pending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palavras-chave</CardTitle>
              <CardDescription>Separe por vírgula ou linha.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draft.keywordsText}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    keywordsText: e.target.value,
                  }))
                }
                rows={5}
                disabled={pending}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Descrição longa</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draft.long_description}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    long_description: e.target.value,
                  }))
                }
                rows={10}
                disabled={pending}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Bullets</CardTitle>
              <CardDescription>Um bullet por linha (4 a 8 itens).</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draft.bulletsText}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    bulletsText: e.target.value,
                  }))
                }
                rows={8}
                disabled={pending}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sugestões SEO</CardTitle>
              <CardDescription>Uma sugestão por linha.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draft.seoSuggestionsText}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    seoSuggestionsText: e.target.value,
                  }))
                }
                rows={6}
                disabled={pending}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
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
              {output.bullets.map((bullet, index) => (
                <CopyBlock
                  key={index}
                  label={`Bullet ${index + 1}`}
                  text={bullet}
                />
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
                text={output.seo_suggestions
                  .map((item, index) => `${index + 1}. ${item}`)
                  .join("\n")}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {!editing ? (
        <ListingQualityFeedback
          listingId={listingId}
          productName={productName}
          categoryLabel={categoryLabel}
          existingTags={qualityFeedbackTags}
          existingNotes={qualityFeedbackNotes}
        />
      ) : null}
    </div>
  );
}
