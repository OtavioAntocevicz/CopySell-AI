"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ListingAiOutput } from "@/domains/listing/schemas";
import { getMarketplaceExporter } from "@/domains/marketplace/registry";
import { rowsToCsv } from "@/lib/csv";
import { ML_CSV_EXPORT_LAYOUT_VERSION } from "@/domains/marketplace/mercado-livre/export";
import { buildListingAiClipboardText } from "@/lib/listing-clipboard-text";

type Props = {
  productName: string;
  categorySlug: string;
  categoryLabel: string;
  output: ListingAiOutput;
};

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("Não foi possível copiar");
  }
}

export function ListingExportToolbar(props: Props) {
  const exporter = useMemo(() => getMarketplaceExporter("mercado_livre"), []);

  const csvBlobUrl = useMemo(() => {
    const row = exporter.toRow({
      productName: props.productName,
      category: props.categorySlug,
      title: props.output.title,
      shortDescription: props.output.short_description,
      longDescription: props.output.long_description,
      bullets: props.output.bullets,
      keywords: props.output.keywords,
    });
    const csv = rowsToCsv(exporter.headers(), [row]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [exporter, props]);

  useEffect(() => {
    return () => URL.revokeObjectURL(csvBlobUrl);
  }, [csvBlobUrl]);

  const downloadCsv = useCallback(() => {
    const a = document.createElement("a");
    a.href = csvBlobUrl;
    a.download = `copysell-anuncio-${ML_CSV_EXPORT_LAYOUT_VERSION}.csv`;
    a.click();
    toast.success("CSV gerado");
  }, [csvBlobUrl]);

  const copyAll = useCallback(() => {
    void copyText(
      "Conteúdo completo",
      buildListingAiClipboardText({
        productName: props.productName,
        categoryLabel: props.categoryLabel,
        output: props.output,
      }),
    );
  }, [props]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={copyAll}>
        <Copy className="mr-2 size-4" />
        Copiar tudo
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={downloadCsv}>
        <Download className="mr-2 size-4" />
        Exportar CSV
      </Button>
    </div>
  );
}

export function CopyBlock({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b pb-3 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={() => void copyText(label, text)}
      >
        <Copy className="size-4" />
      </Button>
    </div>
  );
}
