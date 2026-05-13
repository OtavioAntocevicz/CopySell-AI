# Analise tecnica geral

## Pontos fortes

- **Stack enxuta**: Next + Supabase reduz operacao.
- **Seguranca base solida**: RLS + trigger de privilegios + storage por usuario.
- **IA encapsulada**: prompt e chamada Gemini isolados; facil trocar modelo ou versao.
- **Billing manual explicito**: adequado a MVP antes de gateway.

## Divida tecnica / legado

- Migrations antigas **squashadas** em um arquivo: ambientes legados precisam alinhamento de historico.
- README raiz era template `create-next-app` - substituido por doc orientada ao produto.
- Constantes de versao de prompt antigas (`V1`/`V2`) foram removidas do codigo; apenas `PROMPT_VERSION_ML_V3` permanece.

## Riscos

- **Sem rate limit distribuido**: abuso pode pressionar Gemini ou Storage.
- **Gemini custo/latencia**: dependencia de terceiros; falhas transiente mitigadas mas nao eliminadas.
- **Lista admin de usuarios** sem paginacao pode degradar com muitos registros.

## Oportunidades de otimizacao

- Cache de catalogo de planos e labels.
- Testes automatizados em `usage-service` e parsing de saida IA.
- E2E critico: login + geracao + bloqueio por limite.

## Proximos passos sugeridos

1. Gateway de pagamento e sincronia de `subscription_status`.
2. Fila de geracao e metricas (tempo medio, taxa de erro).
3. Paginacao server-side nas telas admin.

## Links

- [INDICE](../INDICE.md)
- [README principal](../README.md)
