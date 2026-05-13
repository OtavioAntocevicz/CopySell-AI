# Modulos principais de componentes

Tabela de arquivos criticos (detalhe no proprio arquivo via `@module`).

| Arquivo | Responsabilidade |
|---------|------------------|
| `layout/DashboardShell.tsx` | Shell logado: sidebar, nav admin, estado colapsado |
| `layout/UserMenu.tsx` | Menu usuario / logout |
| `features/listing/ListingForm.tsx` | Formulario geracao + action |
| `features/auth/LoginForm.tsx` / `SignupForm.tsx` | Auth email e OAuth |
| `features/profile/ProfileForm.tsx` | Conta / cadastro |
| `admin/AdminUsersTable.tsx` | Tabela + filtros + dialog gestao |
| `admin/AdminBillingRequestsTable.tsx` | Avisos + modal + links usuario |
| `admin/AdminUserManagePanel.tsx` | Painel gestao plano/creditos |
| `admin/AdminUserManageDialog.tsx` | Dialog wrapper |
| `admin/AdminGrantExtraCredits.tsx` | Form creditar |
| `plans/PricingPlans.tsx` | UI de planos logada |
| `plans/BillingRequestModal.tsx` | Modal pedido |
| `dashboard/UserBillingRequestsTable.tsx` | Lista pedidos usuario |
| `dashboard/SupportTicketForm.tsx` | Chamado suporte |
| `marketing/LandingPlansSection.tsx` | Planos na landing |

## Dependencias tipicas

- `@/components/ui/*` - primitivos.
- `@/server/.../actions` - Server Actions importadas em client components (padrao Next permitido).

## Links

- [IA fluxo](../ia/fluxo-de-geracao.md)
- [Admin](../admin/README.md)
