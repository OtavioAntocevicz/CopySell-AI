import { AdminGeminiKeyPanel } from "@/components/admin/AdminGeminiKeyPanel";
import { requireAdmin } from "@/server/admin/require-admin";
import { getGeminiKeyAdminStatus } from "@/server/secrets/gemini-api-key";

export default async function AdminGeminiKeyPage() {
  await requireAdmin();
  const status = await getGeminiKeyAdminStatus();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Chave Gemini</h2>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Rotacione a chave da API gratuita para testes sem redeploy. Uso interno
          — apenas administradores.
        </p>
      </div>
      <AdminGeminiKeyPanel status={status} />
    </div>
  );
}
