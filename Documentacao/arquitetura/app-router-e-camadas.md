# App Router e camadas

## Grupos de rotas (`src/app`)

| Grupo | Caminho | Proposito |
|-------|---------|-----------|
| Marketing | `(marketing)/` | Paginas publicas como `/planos` |
| Auth UI | `(auth)/` | `/login`, `/signup` |
| Dashboard | `(dashboard)/` | Area logada usuario + `/admin` aninhado |
| Raiz | `page.tsx` | Landing `/` |
| Callback | `auth/callback/route.ts` | OAuth code exchange |

Layouts encadeiam shell (ex.: `DashboardShell` em `(dashboard)/layout.tsx`).

## Server vs Client Components

- **Server Components** (padrao): buscam dados com `createClient()` de `@/server/supabase/server` sem expor segredos.
- **Client Components** (`"use client"`): navegacao, formularios interativos, tabelas com estado; chamam Server Actions importadas.

## Middleware

Arquivo: `src/middleware.ts` -> `updateSession` em `src/lib/supabase/middleware.ts`.

- Atualiza cookies de sessao Supabase em quase todas as rotas.
- `matcher` exclui assets estaticos.

## Comunicacao entre modulos

| De | Para | Mecanismo |
|----|------|-----------|
| UI | Supabase (leitura segura) | Server Component + cliente anon autenticado |
| UI | Mutacao | Server Action |
| Server Action | Postgres | `@supabase/ssr` server client (JWT usuario) |
| Policy SQL | Auth | `auth.uid()`, `is_admin()` |

## Links

- [Diagramas](./diagramas.md)
- [Frontend: paginas](../frontend/estrutura-e-paginas.md)
- [Auth](../auth/README.md)
