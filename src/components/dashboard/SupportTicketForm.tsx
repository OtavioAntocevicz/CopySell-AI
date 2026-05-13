"use client";

/**
 * @module src/components/dashboard/SupportTicketForm
 * Formulario de chamado geral (`submitSupportRequest`, kind support).
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { submitSupportRequest } from "@/server/billing/billing-request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SupportTicketForm({ defaultPhone }: { defaultPhone: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(defaultPhone);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo chamado de suporte</CardTitle>
        <CardDescription>
          Use para dúvidas, problemas técnicos ou pedidos que não sejam upgrade de
          plano ou compra de créditos (esses continuam em Planos).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback ? (
          <Alert variant={feedback.ok ? "default" : "destructive"}>
            <AlertTitle>{feedback.ok ? "Enviado" : "Erro"}</AlertTitle>
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="sup-title">Assunto</Label>
          <Input
            id="sup-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resumo do pedido"
            maxLength={120}
            disabled={pending || Boolean(feedback?.ok)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sup-msg">Mensagem</Label>
          <Textarea
            id="sup-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva o que precisa"
            rows={5}
            maxLength={4000}
            disabled={pending || Boolean(feedback?.ok)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sup-phone">WhatsApp para retorno</Label>
          <Input
            id="sup-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="DDD + número"
            autoComplete="tel"
            disabled={pending || Boolean(feedback?.ok)}
          />
        </div>
        <Button
          type="button"
          disabled={pending || Boolean(feedback?.ok)}
          onClick={() => {
            setFeedback(null);
            start(async () => {
              const r = await submitSupportRequest({ title, message, phone });
              if (r.ok) {
                setTitle("");
                setMessage("");
                setPhone(defaultPhone);
                setFeedback({
                  ok: true,
                  text: "Chamado registrado. Você pode acompanhar o status na lista abaixo.",
                });
                router.refresh();
                return;
              }
              setFeedback({ ok: false, text: r.message });
            });
          }}
        >
          {pending ? "Enviando…" : "Enviar chamado"}
        </Button>
      </CardContent>
    </Card>
  );
}
