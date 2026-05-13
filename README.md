# CopySell AI

SaaS para **gerar anúncios para marketplaces com IA** (título, descrições, bullets, palavras-chave) a partir da **foto do produto**, nome e categoria, com **planos**, **limites por ciclo**, **créditos extras** e **área administrativa**.

## Documentacao

Toda a documentacao tecnica vive na pasta **[`Documentacao/`](./Documentacao/README.md)** (onboarding, arquitetura, API/Actions, banco, IA, billing, seguranca, convencoes e analise).

- [Indice completo de arquivos](./Documentacao/INDICE.md)

## Requisitos

- Node.js 20+
- Conta [Supabase](https://supabase.com) e projeto configurado
- Chave [Google AI (Gemini)](https://ai.google.dev/)

## Configuracao

Copie variaveis para `.env.local` (veja [`Documentacao/deploy/variaveis-ambiente.md`](./Documentacao/deploy/variaveis-ambiente.md)):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

Aplique as migrations em `supabase/migrations/` no seu projeto Supabase (hoje um arquivo consolidado; detalhes na doc de banco).

## Scripts

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # build de producao
npm run lint     # ESLint
npm run test     # Vitest
```

## Licenca

Projeto privado (`private: true` no `package.json`).
