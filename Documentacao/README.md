# CopySell AI - Documentacao do produto

Bem-vindo ao pacote de documentacao do **CopySell AI**: SaaS para geracao de anuncios para **marketplaces** com IA (texto multimodal a partir de foto, nome e categoria), com autenticacao Supabase, limites por plano, creditos extras e painel administrativo.

## Objetivo do SaaS

Reduzir o tempo para publicar anuncios de qualidade em marketplaces, mantendo **regras de titulo, bullets e SEO** alinhadas a vitrines de e-commerce, com **controle de uso** escalavel (planos, ciclo mensal, creditos avulsos).

## Publico-alvo

- Vendedores individuais e pequenas equipes que publicam em marketplaces.
- Operacao interna (admin) para upgrades **manuais** ate integracao com gateway.

## Stack (referencia rapida)

| Camada | Tecnologia |
|--------|------------|
| App | Next.js 16 (App Router), React 19 |
| UI | Tailwind CSS 4, componentes Base UI / padrao shadcn (`src/components/ui`) |
| Dados | Supabase (Postgres, Auth, Storage, RLS) |
| IA | Google Gemini (`@google/generative-ai`) |
| Validacao | Zod |

## Estrutura do repositorio (codigo)

```
src/app/          Rotas, layouts, paginas (grupos: auth, dashboard, marketing)
src/components/   UI de produto (admin, dashboard, features, plans, layout)
src/server/       Logica de servidor (Supabase, IA, billing, uso)
src/lib/          Utilitarios, logger, erros, helpers Supabase
src/domains/      Regras e schemas de dominio (listing, conectores de marketplace)
supabase/migrations/  Schema consolidado (ver banco/migrations.md)
```

Cabecalhos `/** @module ... */` marcam modulos em `src/server`, `src/lib` e `src/domains`; componentes criticos usam o mesmo padrao (ver [componentes](./componentes/README.md)).

## Como rodar localmente

```bash
npm install
# Configure .env (ver deploy/variaveis-ambiente.md)
npm run dev
```

Abra `http://localhost:3000`. Usuarios logados na landing sao redirecionados para `/dashboard`.

## Deploy (visao geral)

O app e compativel com qualquer host Node que suporte Next.js (ex.: Vercel, Docker). Variaveis publicas do Supabase e `GEMINI_API_KEY` sao obrigatorias no runtime do servidor. Detalhes: [deploy/README.md](./deploy/README.md).

## Arquitetura atual (resumo)

- **Sem API REST publica** generica: mutacoes via **Server Actions** (`"use server"`) e uma rota **GET `/auth/callback`** para OAuth.
- **RLS** no Postgres: isolamento por `auth.uid()`; admins usam funcao SQL `is_admin()` nas policies.
- **IA** roda apenas no servidor; imagens em bucket privado `product-images`.

Diagramas e fluxos: [arquitetura/](./arquitetura/README.md).

## Navegacao na documentacao

| Area | Descricao |
|------|-------------|
| [INDICE.md](./INDICE.md) | Indice completo de todos os arquivos `.md` |
| [arquitetura/](./arquitetura/README.md) | Visao de sistema, App Router, middleware, diagramas |
| [backend/](./backend/README.md) | Server Actions, servicos, erros |
| [frontend/](./frontend/README.md) | Paginas, client vs server, navegacao |
| [banco/](./banco/README.md) | Tabelas, RLS, RPC, migrations |
| [api/](./api/README.md) | Catalogo de endpoints e actions |
| [auth/](./auth/README.md) | Login, sessao, roles, protecao de rotas |
| [billing/](./billing/README.md) | Planos, limites, solicitacoes manuais |
| [ia/](./ia/README.md) | Pipeline Gemini, prompts, limites |
| [admin/](./admin/README.md) | Paineis e operacoes administrativas |
| [componentes/](./componentes/README.md) | UI por modulo |
| [fluxos/](./fluxos/README.md) | Jornadas de usuario e sistema |
| [deploy/](./deploy/README.md) | Env, build, publicacao |
| [seguranca/](./seguranca/README.md) | RLS, upload, variaveis, abuso |
| [performance/](./performance/README.md) | Gargalos e otimizacoes |
| [convencoes/](./convencoes/README.md) | Padroes de codigo e pastas |
| [manutencao/](./manutencao/README.md) | Como evoluir o produto |
| [analise/](./analise/analise-tecnica.md) | Pontos fortes, riscos, divida tecnica |

---

**Manutencao desta pasta:** ao adicionar dominio novo, crie subpasta ou arquivo `.md`, atualize [INDICE.md](./INDICE.md) e uma linha neste README.
