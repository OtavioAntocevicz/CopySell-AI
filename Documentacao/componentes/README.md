# Componentes (UI)

## Conteudo

- [Modulos principais](./modulos-principais.md)

## Convencao `@module`

Componentes grandes usam bloco JSDoc no topo (apos `"use client"` quando existir):

```tsx
/**
 * @module src/components/...
 * Responsabilidade: ...
 * Props / dependencias: ...
 */
```

## Pastas

| Pasta | Exemplos |
|-------|----------|
| `layout` | `DashboardShell`, `UserMenu` |
| `admin` | `AdminUsersTable`, `AdminBillingRequestsTable`, paineis |
| `features` | `ListingForm`, `LoginForm`, `SignupForm`, `ProfileForm` |
| `plans` | `PricingPlans`, `BillingRequestModal` |
| `dashboard` | `UserBillingRequestsTable`, `SupportTicketForm` |
| `marketing` | `LandingPlansSection` |

## Links

- [Frontend](../frontend/README.md)
- [INDICE](../INDICE.md)

[Voltar](../README.md)
