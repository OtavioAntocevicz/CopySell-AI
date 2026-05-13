# Sessao e middleware

## Fluxo de refresh

1. Navegador solicita rota protegida.
2. `middleware.ts` chama `updateSession` (`src/lib/supabase/middleware.ts`).
3. Cliente Supabase SSR reescreve cookies se o token estiver proximo de expirar.

## OAuth (Google etc.)

1. Usuario inicia login no Supabase (via URL gerada no cliente).
2. Provider retorna para `/auth/callback?code=...`.
3. `route.ts` executa `exchangeCodeForSession` e redireciona.

## Persistencia

- Cookies **httpOnly** (conforme opcoes Supabase SSR) - nao armazenar JWT em `localStorage` no fluxo padrao atual.

## Logout

- Via `UserMenu` / Supabase `signOut` (ver componente).

## Links

- [Arquitetura: diagramas](../arquitetura/diagramas.md)
- [Frontend: shell](../frontend/estrutura-e-paginas.md)
