"use client";

/**
 * @module src/components/features/profile/ProfileForm
 * Edicao de perfil do usuario logado via Server Action `updateOwnProfile`.
 */
import { useActionState, useMemo } from "react";
import Link from "next/link";

import { updateOwnProfile } from "@/server/profile/update-own-profile";
import {
  SELLER_SEGMENT_VALUES,
  sellerSegmentLabel,
  type SellerSegment,
} from "@/lib/profile/seller-segment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProfileFormInitial = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  seller_segment: string | null;
  email: string | null;
};

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, undefined);

  /** Evita defaultValue mutando após revalidate (Base UI FieldControl). */
  const formKey = useMemo(
    () =>
      [
        initial.email ?? "",
        initial.first_name ?? "",
        initial.last_name ?? "",
        initial.phone ?? "",
        initial.company_name ?? "",
        initial.seller_segment ?? "",
      ].join("\u{1e}"),
    [
      initial.email,
      initial.first_name,
      initial.last_name,
      initial.phone,
      initial.company_name,
      initial.seller_segment,
    ],
  );

  return (
    <form key={formKey} action={formAction} className="flex max-w-lg flex-col gap-4">
      {state?.ok === false ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível salvar</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok === true ? (
        <Alert>
          <AlertTitle>Salvo</AlertTitle>
          <AlertDescription>Seus dados foram atualizados.</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          value={initial.email ?? ""}
          readOnly
          disabled
          className="bg-muted"
        />
        <p className="text-muted-foreground text-xs">
          O e-mail de login é gerenciado pelo provedor de autenticação.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nome</Label>
          <Input
            id="first_name"
            name="first_name"
            autoComplete="given-name"
            required
            disabled={pending}
            defaultValue={initial.first_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Sobrenome</Label>
          <Input
            id="last_name"
            name="last_name"
            autoComplete="family-name"
            required
            disabled={pending}
            defaultValue={initial.last_name ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (WhatsApp)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          disabled={pending}
          placeholder="Ex.: 11999998888"
          defaultValue={initial.phone ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seller_segment">Como você vende em marketplaces?</Label>
        <Select
          name="seller_segment"
          required
          disabled={pending}
          defaultValue={
            initial.seller_segment &&
            SELLER_SEGMENT_VALUES.includes(initial.seller_segment as SellerSegment)
              ? initial.seller_segment
              : null
          }
        >
          <SelectTrigger id="seller_segment" className="w-full">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            {SELLER_SEGMENT_VALUES.map((id) => (
              <SelectItem key={id} value={id}>
                {sellerSegmentLabel(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Ajuda-nos a entender o público e priorizar recursos (visível apenas para a
          equipe interna).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Nome da empresa (opcional)</Label>
        <Input
          id="company_name"
          name="company_name"
          autoComplete="organization"
          disabled={pending}
          placeholder="Útil se você atua como fornecedor"
          defaultValue={initial.company_name ?? ""}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
      <p className="text-muted-foreground text-center text-sm sm:text-left">
        <Link href="/dashboard" className="underline">
          Voltar ao histórico
        </Link>
      </p>
    </form>
  );
}
