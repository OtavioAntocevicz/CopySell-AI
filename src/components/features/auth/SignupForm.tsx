"use client";

/**
 * @module src/components/features/auth/SignupForm
 * Cadastro com metadados (nome, telefone, segmento de venda em marketplaces) enviados ao `raw_user_meta_data` do Supabase.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  SELLER_SEGMENT_VALUES,
  type SellerSegment,
  buildDisplayName,
  registrationProfileSchema,
  sellerSegmentLabel,
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

const signupCredentialsSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "Senha: mínimo 6 caracteres"),
});

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signUpWithGoogle() {
    setError(null);
    setInfo(null);
    setPending(true);
    const supabase = createClient();
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    setPending(false);
    if (oauthErr) setError(oauthErr.message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const companyRaw = String(form.get("company_name") ?? "").trim();

    const cred = signupCredentialsSchema.safeParse({ email, password });
    if (!cred.success) {
      setPending(false);
      setError(cred.error.issues.map((i) => i.message).join(" · "));
      return;
    }

    const profile = registrationProfileSchema.safeParse({
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      phone: form.get("phone"),
      company_name: companyRaw.length ? companyRaw : undefined,
      seller_segment: form.get("seller_segment"),
    });
    if (!profile.success) {
      setPending(false);
      setError(profile.error.issues.map((i) => i.message).join(" · "));
      return;
    }

    const displayName = buildDisplayName({
      first_name: profile.data.first_name,
      last_name: profile.data.last_name,
    });

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: signErr } = await supabase.auth.signUp({
      email: cred.data.email,
      password: cred.data.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          first_name: profile.data.first_name,
          last_name: profile.data.last_name,
          phone: profile.data.phone,
          company_name: profile.data.company_name ?? "",
          seller_segment: profile.data.seller_segment,
          display_name: displayName,
        },
      },
    });

    setPending(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    setInfo(
      "Se o e-mail de confirmação estiver habilitado no projeto, verifique sua caixa de entrada.",
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Cadastro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert>
          <AlertTitle>Quase lá</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nome</Label>
          <Input
            id="first_name"
            name="first_name"
            autoComplete="given-name"
            required
            disabled={pending}
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seller_segment">Como você vende em marketplaces?</Label>
        <Select name="seller_segment" required disabled={pending}>
          <SelectTrigger id="seller_segment" className="w-full">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            {SELLER_SEGMENT_VALUES.map((id: SellerSegment) => (
              <SelectItem key={id} value={id}>
                {sellerSegmentLabel(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Nome da empresa (opcional)</Label>
        <Input
          id="company_name"
          name="company_name"
          autoComplete="organization"
          disabled={pending}
          placeholder="Útil se você atua como fornecedor"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">Mínimo 6 caracteres.</p>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">ou</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="w-full"
        onClick={() => void signUpWithGoogle()}
      >
        Continuar com Google
      </Button>
      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Ao criar sua conta, você concorda com os{" "}
        <Link href="/termos" className="text-foreground underline">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="text-foreground underline">
          Política de Privacidade
        </Link>
        .
      </p>
      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="text-foreground underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
