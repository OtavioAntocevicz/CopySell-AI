# Servicos internos (server)

Principais modulos em `src/server` (ver tambem `/** @module */` em cada arquivo).

| Modulo | Arquivo / pasta | Responsabilidade |
|--------|-----------------|------------------|
| Geracao de listing | `listing/aiListingService.ts` | Orquestra gate, upload, Gemini, validacao Zod, insert listing, uso |
| Uso e limites | `usage/usage-service.ts` | `canUserGenerate`, incremento pos-sucesso, resumo de uso |
| Ciclo de cobranca | `usage/billing-period.ts` | Calculo de periodo mensal por ancora |
| Limites de plano | `usage/plan-limits.ts` | Normaliza JSON `plans.limits` |
| Gemini | `ai/gemini.ts` | Chamada multimodal, timeout, retry transiente |
| Prompts ML | `ai/prompts/mercado-livre-v3.ts` | System + payload usuario |
| Upload imagem | `storage/uploadProductImage.ts` | Bucket `product-images`, path por usuario |
| Billing manual | `billing/billing-request-actions.ts` | Insere `billing_requests` |
| Catalogo precos | `billing/load-pricing-plans.ts` | Junta DB + catalogo estatico |
| Admin dados | `admin/queries.ts` | Leituras agregadas (overview, usuarios, avisos) |
| Admin mutacoes | `admin/actions.ts` | Plano, bloqueio, status, creditos, avisos |
| Perfil | `profile/update-own-profile.ts` | Atualiza dados cadastrais do proprio usuario |
| Analytics | `analytics/behavior-insights.ts` | Agregacoes para admin IA |
| Comportamento listing | `listing/behavior/tracking.ts` | Insert em `listing_behavior_events` |

## Helpers importantes

- `src/server/supabase/server.ts` - cliente servidor com cookies (RLS).
- `src/server/supabase/public.ts` - leituras anon autenticadas onde aplicavel (ex.: planos publicos).

## Links

- [IA: fluxo](../ia/fluxo-de-geracao.md)
- [Banco](../banco/tabelas-e-relacoes.md)
