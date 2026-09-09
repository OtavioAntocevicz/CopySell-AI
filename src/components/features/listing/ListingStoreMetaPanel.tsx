"use client";

import type { ListingStoreMeta } from "@/domains/listing/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyBlock } from "@/components/features/listing/ListingExportToolbar";

type Props = {
  storeMeta: ListingStoreMeta;
};

export function ListingStoreMetaPanel({ storeMeta }: Props) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: "Slug (URL)", value: storeMeta.slug },
    { label: "Meta title", value: storeMeta.meta_title },
    { label: "Meta description", value: storeMeta.meta_description },
    { label: "H1 sugerido", value: storeMeta.h1_suggestion },
    { label: "Open Graph", value: storeMeta.og_description },
    { label: "Notas para publicação", value: storeMeta.notes_for_seller },
  ].filter((f) => f.value && f.value.trim());

  if (fields.length === 0) return null;

  return (
    <Card className="border-violet-500/30 bg-violet-500/5">
      <CardHeader>
        <CardTitle>SEO da loja própria</CardTitle>
        <CardDescription>
          Campos sugeridos pela IA para publicar na sua loja virtual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {fields.map((f) => (
          <CopyBlock key={f.label} label={f.label} text={f.value!} />
        ))}
      </CardContent>
    </Card>
  );
}
