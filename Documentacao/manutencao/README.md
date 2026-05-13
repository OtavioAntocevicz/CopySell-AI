# Manutencao e evolucao

## Checklist ao adicionar...

### Novo plano

1. Migration ou update em `plans` (limits, nome, ordem).
2. `src/server/billing/plans.ts` (`PlanId`) e catalogo se precisar de preco estatico.
3. UI em `PricingPlans` / landing.
4. Atualizar [billing](../billing/README.md) e testes manuais de `canUserGenerate`.

### Nova Server Action

1. Arquivo em `src/server/...` ou `src/app/.../actions.ts` com `"use server"`.
2. Validar auth e inputs.
3. Documentar em [api/catalogo-completo.md](../api/catalogo-completo.md) e [INDICE](../INDICE.md) se novo topico.

### Novo modulo de IA / versao de prompt

1. Copiar padrao `mercado-livre-v3.ts` + constante `PROMPT_VERSION`.
2. Ajustar `aiListingService` para selecionar versao (hoje fixo v3).
3. Documentar em [ia/](../ia/README.md).

### Nova pagina

1. Criar em `src/app/.../page.tsx` no grupo correto (marketing vs dashboard).
2. Adicionar link de navegacao se necessario (`DashboardShell`).
3. [frontend/estrutura](../frontend/estrutura-e-paginas.md).

### Nova tabela

1. Migration SQL idempotente.
2. Policies RLS + indices.
3. Tipos / queries em `src/server`.
4. [banco/tabelas](../banco/tabelas-e-relacoes.md).

### Novo admin

1. Promover `profiles.role` para `admin` (operacao SQL controlada).
2. Verificar acesso a `/admin/*`.

## Links

- [Escalonamento SaaS](./escalonamento-saas.md)
- [Analise tecnica](../analise/analise-tecnica.md)

[Voltar](../README.md)
