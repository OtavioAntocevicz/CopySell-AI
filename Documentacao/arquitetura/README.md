# Arquitetura

Documentacao de alto nivel: como as partes se conectam e onde encontrar codigo.

## Conteudo desta pasta

- [Diagramas (Mermaid e texto)](./diagramas.md)
- [App Router e camadas](./app-router-e-camadas.md)

## Principios

1. **Colocation**: rotas em `src/app`, UI em `src/components`, regra de negocio em `src/server` e `src/domains`.
2. **Seguranca por padrao**: dados sensiveis via Supabase com RLS; sem expor service role no browser.
3. **IA no servidor**: nenhuma chave Gemini no cliente; upload validado antes do modelo.

## Fluxo resumido (geracao)

Usuario autenticado envia formulario em `/dashboard/novo` -> **Server Action** `generateListingAction` -> `generateListingForUser` (gate de uso, upload Storage, Gemini, insert `listings`, incremento de uso ou debito de credito extra).

## Proximos passos de leitura

- [Backend: servicos](../backend/servicos-internos.md)
- [IA: fluxo](../ia/fluxo-de-geracao.md)
- [Banco: tabelas](../banco/tabelas-e-relacoes.md)

[Voltar ao README principal](../README.md)
