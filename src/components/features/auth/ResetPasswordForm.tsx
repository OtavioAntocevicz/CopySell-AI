"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setSessionReady(Boolean(data.session));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    if (password.length < 6) {
      setPending(false);
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setPending(false);
      setError("As senhas não coincidem.");
      return;
    }

    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    setPending(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (sessionReady === null) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Verificando link de recuperação…
      </p>
    );
  }

  if (!sessionReady) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Link inválido ou expirado</AlertTitle>
          <AlertDescription>
            Solicite um novo link de recuperação de senha.
          </AlertDescription>
        </Alert>
        <Link
          href="/login/forgot"
          className={cn(buttonVariants(), "w-full justify-center")}
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Nova senha</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-muted-foreground text-sm">
        Defina uma nova senha para sua conta.
      </p>

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          disabled={pending}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
