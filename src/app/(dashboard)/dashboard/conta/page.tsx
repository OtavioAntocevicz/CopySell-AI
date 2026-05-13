import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/features/profile/ProfileForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/server/supabase/server";

export const metadata = {
  title: "Minha conta | CopySell AI",
};

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, phone, company_name, seller_segment, email",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!profile) {
    return (
      <p className="text-muted-foreground text-sm">
        Perfil não encontrado. Entre em contato com o suporte.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Atualize nome, telefone e como você vende em marketplaces. Usamos isso
          para suporte e visão agregada no painel interno (sem compartilhar com
          terceiros).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>
            Campos obrigatórios ajudam a equipe a entender melhor o público da
            plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              first_name: profile.first_name as string | null,
              last_name: profile.last_name as string | null,
              phone: profile.phone as string | null,
              company_name: profile.company_name as string | null,
              seller_segment: profile.seller_segment as string | null,
              email: user.email ?? (profile.email as string | null),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
