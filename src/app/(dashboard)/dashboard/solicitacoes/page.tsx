import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupportTicketForm } from "@/components/dashboard/SupportTicketForm";
import { UserBillingRequestsTable } from "@/components/dashboard/UserBillingRequestsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listOwnBillingRequests } from "@/server/billing/billing-requests-queries";
import { createClient } from "@/server/supabase/server";

export const metadata: Metadata = {
  title: "Solicitações",
  description: "Acompanhe chamados de suporte e pedidos de plano ou créditos.",
};

export default async function SolicitacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, rows] = await Promise.all([
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
    listOwnBillingRequests(supabase, user.id),
  ]);

  const defaultPhone = (profile?.phone as string | null)?.trim() ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Solicitações</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Suporte geral, além do histórico do que você pediu em planos e créditos.
        </p>
      </div>

      <SupportTicketForm defaultPhone={defaultPhone} />

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>
            Inclui solicitações feitas em Planos (assinatura e pacotes de
            créditos) e chamados abertos por aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserBillingRequestsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
