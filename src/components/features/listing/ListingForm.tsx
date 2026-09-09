"use client";

/**
 * @module src/components/features/listing/ListingForm
 * Formulario de geracao de anuncio; usa `useActionState` com `generateListingAction` e upload de imagem.
 */
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { categoryOptions } from "@/lib/categoryLabels";
import { MARKETPLACE_OPTIONS } from "@/domains/marketplace/types";
import { generateListingAction } from "@/app/(dashboard)/dashboard/novo/actions";
import { generateListingInitialState } from "@/app/(dashboard)/dashboard/novo/generateListingState";

type Props = {
  disabled?: boolean;
  maxImages?: number;
};

export function ListingForm({ disabled, maxImages = 1 }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [marketplace, setMarketplace] = useState("mercado_livre");
  const [state, formAction, pending] = useActionState(
    generateListingAction,
    generateListingInitialState,
  );
  const formDisabled = pending || !!disabled;
  const selectedChannel = MARKETPLACE_OPTIONS.find((o) => o.id === marketplace);

  useEffect(() => {
    if (state.ok) {
      router.push(`/dashboard/listings/${state.listingId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="mx-auto flex max-w-lg flex-col gap-6">
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="marketplace" value={marketplace} />

      {state.ok === false && state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível gerar</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="marketplace-select">Onde você vai publicar?</Label>
        <Select
          value={marketplace}
          onValueChange={(v) => setMarketplace(v ?? "mercado_livre")}
          disabled={formDisabled}
        >
          <SelectTrigger id="marketplace-select" className="w-full">
            <SelectValue placeholder="Selecione o canal" />
          </SelectTrigger>
          <SelectContent>
            {MARKETPLACE_OPTIONS.map((o) => (
              <SelectItem
                key={o.id}
                value={o.id}
                disabled={!o.available}
              >
                {o.label}
                {!o.available ? " (em breve)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedChannel ? (
          <p className="text-muted-foreground text-xs">{selectedChannel.description}</p>
        ) : null}
        {marketplace === "loja_propria" ? (
          <p className="text-muted-foreground text-xs">
            A IA também sugere slug, meta title, meta description e campos para SEO da sua loja.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">Nome do produto</Label>
        <Input
          id="productName"
          name="productName"
          placeholder="Ex.: Fone Bluetooth XYZ"
          required
          maxLength={200}
          disabled={formDisabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-select">Categoria</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v ?? "")}
          disabled={formDisabled}
        >
          <SelectTrigger id="category-select" className="w-full">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions().map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sellerNotes">Detalhes extras do produto (opcional)</Label>
        <Textarea
          id="sellerNotes"
          name="sellerNotes"
          placeholder="Ex.: voltagem 127 V, cor preta, kit com 2 peças, garantia de 12 meses, diferenciais que não aparecem na foto…"
          rows={5}
          maxLength={4000}
          disabled={formDisabled}
          className="min-h-[120px] resize-y"
        />
        <p className="text-muted-foreground text-xs">
          Quanto mais contexto real você der, melhor a IA alinha título, bullets e descrição ao que você vende (até 4000 caracteres).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">
          {maxImages > 1 ? "Imagens do produto" : "Imagem do produto"}
        </Label>
        <Input
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          multiple={maxImages > 1}
          disabled={formDisabled}
        />
        <p className="text-muted-foreground text-xs">
          JPEG, PNG ou WebP — máximo 2 MB cada.
          {maxImages > 1
            ? ` Selecione até ${maxImages} fotos (ângulos diferentes ajudam a IA).`
            : null}
        </p>
      </div>

      <Button
        type="submit"
        disabled={formDisabled || !category}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Gerando com IA…
          </>
        ) : (
          "Gerar anúncio otimizado"
        )}
      </Button>
    </form>
  );
}
