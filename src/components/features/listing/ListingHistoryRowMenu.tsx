"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteListingAction } from "@/app/(dashboard)/dashboard/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listingAiOutputSchema } from "@/domains/listing/schemas";
import { buildListingAiClipboardText } from "@/lib/listing-clipboard-text";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

async function copyToClipboard(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("Não foi possível copiar");
  }
}

type Props = {
  listingId: string;
  productName: string;
  status: string;
  /** JSON salvo em `listings.outputs` (apenas leitura no cliente). */
  outputs: unknown;
  categoryLabel: string;
};

export function ListingHistoryRowMenu({
  listingId,
  productName,
  status,
  outputs,
  categoryLabel,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const parsedOutput = useMemo(
    () => listingAiOutputSchema.safeParse(outputs),
    [outputs],
  );

  const canCopy = status === "completed" && parsedOutput.success;

  function handleCopy() {
    if (!parsedOutput.success) {
      toast.error("Conteúdo da IA indisponível neste item.");
      return;
    }
    void copyToClipboard(
      "Conteúdo da IA",
      buildListingAiClipboardText({
        productName,
        categoryLabel,
        output: parsedOutput.data,
      }),
    );
  }

  function handleDelete() {
    const ok = window.confirm(
      `Excluir o anúncio "${productName}"? A imagem no armazenamento também será removida. Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteListingAction(listingId);
      if (result.ok) {
        toast.success("Anúncio excluído.");
        router.refresh();
        return;
      }
      toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "shrink-0",
        )}
        aria-label={`Mais ações: ${productName}`}
        disabled={pending}
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {canCopy ? (
          <DropdownMenuItem onClick={() => handleCopy()}>
            <Copy />
            Copiar conteúdo da IA
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={() => handleDelete()}
        >
          <Trash2 />
          {pending ? "Excluindo…" : "Excluir anúncio"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
