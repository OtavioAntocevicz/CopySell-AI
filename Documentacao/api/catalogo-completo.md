# Catalogo completo - rotas HTTP e Server Actions

Convencoes:

- **Auth usuario**: sessao Supabase (cookie) com JWT; RLS aplica `auth.uid()`.
- **Auth admin**: mesmo JWT + `profiles.role = 'admin'` (verificado no servidor e em SQL via `is_admin()`).
- **Limite de uso**: para geracao, o gate `canUserGenerate` aplica limite mensal do ciclo e/ou creditos extras; nao ha rate limit HTTP separado documentado (ver [seguranca](../seguranca/README.md)).

---

## 1. Route Handlers (HTTP)

| Metodo | Rota | Arquivo | Auth | Query / body | Resposta | Observacoes |
|--------|------|---------|------|--------------|----------|-------------|
| GET | `/auth/callback` | `src/app/auth/callback/route.ts` | N/A (troca `code`) | `code` (obrigatorio), `next` (opcional, default `/dashboard`) | Redirect 302 para `next` ou `/login` em erro | Usa `createServerClient` + cookies; sem corpo JSON |

---

## 2. Server Actions - Admin

**Arquivo:** `src/server/admin/actions.ts`  
**Auth:** admin (`requireAdmin`)

| Funcao | Payload | Retorno | Observacoes |
|--------|---------|---------|---------------|
| `adminSetUserPlan` | `targetUserId: string`, `planId: string` | void (throw em erro) | Atualiza `profiles`: plano, ancora de ciclo, free tier, intervalo |
| `adminSetUserBlocked` | `targetUserId`, `blocked: boolean` | void | `blocked_at` ISO ou null |
| `adminSetUserSubscriptionStatus` | `targetUserId`, `status` | void | Valores validados por `isSubscriptionStatus` |
| `adminResetUserMonthlyUsage` | `targetUserId` | void | Remove linha `user_usage_monthly` do periodo atual |
| `adminSetBillingRequestStatus` | `requestId`, `done` \| `dismissed` | void | Preenche `handled_at` |
| `fetchAdminUserManageContext` | `userId` | `AdminUserWithLimits \| null` | Leitura para painel |
| `adminAddExtraCreditsToUser` | `targetUserId`, `amount` (1..100000) | `{ newBalance: number }` | RPC `admin_add_extra_credits` |

---

## 3. Server Actions - Billing (usuario)

**Arquivo:** `src/server/billing/billing-request-actions.ts`  
**Auth:** usuario logado (redirect `/login` se anonimo)

| Funcao | Payload | Retorno | Observacoes |
|--------|---------|---------|---------------|
| `submitPlanSubscriptionRequest` | `{ targetPlanId, yearly, phone }` | `{ ok: true }` \| `{ ok: false, message }` | `kind = plan_subscribe`; plano pago apenas |
| `submitCreditPurchaseRequest` | `{ packId, phone }` | idem | `kind = credit_purchase`; `packId` validado contra catalogo |
| `submitSupportRequest` | `{ title, message, phone }` | idem | `kind = support` |

Validacoes: Zod interno (telefone, tamanhos de texto).

---

## 4. Server Actions - Perfil

**Arquivo:** `src/server/profile/update-own-profile.ts`  
**Auth:** usuario logado

| Funcao | Payload | Retorno |
|--------|---------|---------|
| `updateOwnProfile` | `FormData` (campos cadastro) | `{ ok: true }` \| `{ ok: false, message }` |

---

## 5. Server Actions - Dashboard

### `src/app/(dashboard)/dashboard/actions.ts`

| Funcao | Payload | Retorno | Auth |
|--------|---------|---------|------|
| `deleteListingAction` | `listingId: string` | `{ ok: true }` \| `{ ok: false, error }` | Dono do listing |

### `src/app/(dashboard)/dashboard/novo/actions.ts`

| Funcao | Payload | Retorno | Auth |
|--------|---------|---------|------|
| `generateListingAction` | `FormData` (produto, categoria, imagem, notas) | `GenerateListingState` (ok + listingId ou erro) | Logado |

---

## 6. RPCs Supabase (chamadas via cliente servidor)

| RPC | Quem | Parametros | Retorno |
|-----|------|------------|---------|
| `increment_own_usage` | Servidor pos-geracao | period, contagens | void |
| `decrement_own_extra_credit` | Servidor | - | integer (saldo ou -1) |
| `admin_add_extra_credits` | Admin | `p_target`, `p_amount` | integer novo saldo |

---

[Voltar](./README.md) | [INDICE](../INDICE.md)
