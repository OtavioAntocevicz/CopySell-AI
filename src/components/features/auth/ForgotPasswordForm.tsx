"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    if (!email) {
      setPending(false);
      setError("Informe seu e-mail.");
      return;
    }

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/login/reset")}`,
      },
    );

    setPending(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }

    setInfo(
      "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha. Verifique também a caixa de spam.",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Recuperação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert>
          <AlertTitle>E-mail enviado</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-muted-foreground text-sm">
        Informe o e-mail da sua conta. Enviaremos um link para criar uma nova
        senha.
      </p>

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

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar link de recuperação"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-foreground underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
