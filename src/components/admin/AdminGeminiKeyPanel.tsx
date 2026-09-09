"use client";

/**
 * @module src/components/admin/AdminGeminiKeyPanel
 * Troca da chave Gemini para testes (quota free do Google AI Studio).
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";

import {
  adminClearGeminiApiKeyFromDatabase,
  adminSaveGeminiApiKey,
} from "@/server/admin/gemini-key-actions";
import type { GeminiKeyAdminStatus } from "@/server/secrets/gemini-api-key";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function sourceLabel(source: GeminiKeyAdminStatus["source"]): string {
  switch (source) {
    case "database":
      return "Banco de dados (admin)";
    case "env":
      return "Variável de ambiente (GEMINI_API_KEY)";
    default:
      return "Nenhuma chave configurada";
  }
}

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminGeminiKeyPanel({ status }: { status: GeminiKeyAdminStatus }) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5" />
            Chave ativa
          </CardTitle>
          <CardDescription>
            Prioridade: chave salva no admin →{" "}
            <code className="rounded bg-muted px-1 text-xs">GEMINI_API_KEY</code>{" "}
            no servidor. A chave completa nunca é exibida após salvar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs">Origem</p>
              <p className="font-medium">{sourceLabel(status.source)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Prévia</p>
              <p className="font-mono text-sm">
                {status.maskedPreview ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Última atualização</p>
              <p>{formatUpdatedAt(status.updatedAt)}</p>
            </div>
          </div>

          {status.source === "none" ? (
            <Alert variant="destructive">
              <AlertTitle>Sem chave Gemini</AlertTitle>
              <AlertDescription>
                Gerações de anúncio falharão até você salvar uma chave abaixo ou
                configurar GEMINI_API_KEY no servidor.
              </AlertDescription>
            </Alert>
          ) : null}

          {!status.canPersistToDatabase && status.persistBlockReason ? (
            <Alert>
              <AlertTitle>Salvar no banco indisponível</AlertTitle>
              <AlertDescription>{status.persistBlockReason}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nova chave</CardTitle>
          <CardDescription>
            Gere em{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Google AI Studio
            </a>{" "}
            quando a cota gratuita esgotar e cole aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-api-key">Chave API (AIza…)</Label>
            <Input
              id="gemini-api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="AIzaSy…"
              value={apiKey}
              disabled={pending || !status.canPersistToDatabase}
              onChange={(e) => {
                setApiKey(e.target.value);
                setMsg(null);
              }}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={pending || !status.canPersistToDatabase || !apiKey.trim()}
              onClick={() => {
                setMsg(null);
                start(async () => {
                  try {
                    await adminSaveGeminiApiKey(apiKey);
                    setApiKey("");
                    setMsg({
                      ok: true,
                      text: "Chave salva. Novas gerações usarão esta chave em até ~30 segundos.",
                    });
                    router.refresh();
                  } catch (e) {
                    setMsg({
                      ok: false,
                      text:
                        e instanceof Error
                          ? e.message
                          : "Falha ao salvar a chave.",
                    });
                  }
                });
              }}
            >
              {pending ? "Salvando…" : "Salvar chave"}
            </Button>

            {status.source === "database" ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending || !status.canPersistToDatabase}
                onClick={() => {
                  setMsg(null);
                  start(async () => {
                    try {
                      await adminClearGeminiApiKeyFromDatabase();
                      setMsg({
                        ok: true,
                        text: "Chave removida do banco. Voltando ao fallback GEMINI_API_KEY (se existir).",
                      });
                      router.refresh();
                    } catch (e) {
                      setMsg({
                        ok: false,
                        text:
                          e instanceof Error
                            ? e.message
                            : "Falha ao remover a chave.",
                      });
                    }
                  });
                }}
              >
                Usar só variável de ambiente
              </Button>
            ) : null}
          </div>

          {msg ? (
            <p
              className={
                msg.ok ? "text-muted-foreground text-sm" : "text-destructive text-sm"
              }
            >
              {msg.text}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
