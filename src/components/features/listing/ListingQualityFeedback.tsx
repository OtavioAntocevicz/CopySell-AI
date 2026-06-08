"use client";

import { useState } from "react";
import { toast } from "sonner";
import { submitListingQualityFeedbackAction } from "@/app/(dashboard)/dashboard/listings/[id]/feedback-actions";
import {
  QUALITY_ISSUE_LABELS,
  QUALITY_ISSUE_TAGS,
  type QualityIssueTag,
} from "@/domains/listing/quality-feedback";
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

type Props = {
  listingId: string;
  productName: string;
  categoryLabel: string;
  existingTags?: QualityIssueTag[];
  existingNotes?: string | null;
};

function buildShareText(
  productName: string,
  categoryLabel: string,
  tags: QualityIssueTag[],
  notes: string,
): string {
  const problems = tags.map((t) => QUALITY_ISSUE_LABELS[t]).join("; ");
  const detail = notes.trim();
  return [
    `Produto: ${productName}`,
    `Categoria: ${categoryLabel}`,
    `Problema: ${problems}${detail ? ` - ${detail}` : ""}`,
  ].join("\n");
}

export function ListingQualityFeedback({
  listingId,
  productName,
  categoryLabel,
  existingTags = [],
  existingNotes = null,
}: Props) {
  const [selected, setSelected] = useState<Set<QualityIssueTag>>(
    () => new Set(existingTags),
  );
  const [notes, setNotes] = useState(existingNotes ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(existingTags.length > 0);

  function toggle(tag: QualityIssueTag) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      toast.error("Marque pelo menos um problema.");
      return;
    }
    setPending(true);
    const result = await submitListingQualityFeedbackAction(listingId, {
      issueTags: [...selected],
      notes: notes.trim() || undefined,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSaved(true);
    toast.success("Feedback registrado. Obrigado!");
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Avaliar qualidade desta geração</CardTitle>
        <CardDescription>
          Ajuda a melhorar a IA. Marque o que não ficou bom e, se quiser, descreva
          o que esperava.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            {QUALITY_ISSUE_TAGS.map((tag) => (
              <label
                key={tag}
                className="hover:bg-muted/50 flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={selected.has(tag)}
                  onChange={() => toggle(tag)}
                  disabled={pending}
                />
                <span>{QUALITY_ISSUE_LABELS[tag]}</span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quality-notes">Detalhes (opcional)</Label>
            <Textarea
              id="quality-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: inventou voltagem 220V; título genérico demais"
              rows={3}
              disabled={pending}
              maxLength={2000}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              {pending ? "Salvando…" : saved ? "Atualizar avaliação" : "Enviar avaliação"}
            </Button>
            {saved && selected.size > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={async () => {
                  const text = buildShareText(
                    productName,
                    categoryLabel,
                    [...selected],
                    notes,
                  );
                  try {
                    await navigator.clipboard.writeText(text);
                    toast.success("Resumo copiado — cole no chat para ajustar a IA.");
                  } catch {
                    toast.error("Não foi possível copiar.");
                  }
                }}
              >
                Copiar resumo para o chat
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
