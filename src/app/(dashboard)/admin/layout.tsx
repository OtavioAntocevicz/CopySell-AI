import { logServerInfo } from "@/lib/logger";
import { requireAdmin } from "@/server/admin/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { adminUserId } = await requireAdmin();
  logServerInfo("admin_access", { userId: adminUserId });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Admin interno
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Operações</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Navegue pelas seções usando o menu lateral. Aqui ficam ferramentas de
          suporte e métricas internas.
        </p>
      </div>
      {children}
    </div>
  );
}
