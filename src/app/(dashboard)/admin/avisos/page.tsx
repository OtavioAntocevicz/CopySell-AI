import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminBillingRequestsTable } from "@/components/admin/AdminBillingRequestsTable";
import { requireAdmin } from "@/server/admin/require-admin";
import { listBillingRequests } from "@/server/admin/queries";

export default async function AdminAvisosPage() {
  const { supabase } = await requireAdmin();
  const rows = await listBillingRequests(supabase);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Avisos / solicitações</CardTitle>
          <CardDescription>
            Pedidos de assinatura e compra de créditos extras enviados pelos
            usuários. Atualize o plano ou o saldo manualmente e marque como
            concluído, ou dispense se não for aplicável.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminBillingRequestsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
