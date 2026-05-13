# Fluxo de geracao IA

## Sequencia

1. **Gate** `canUserGenerate`: bloqueio, assinatura ativa, limite mensal OU creditos extras.
2. **Validacao de imagem**: MIME permitido (`ALLOWED_IMAGE_MIMES`), tamanho <= min(`MAX_IMAGE_BYTES`, limite do plano).
3. **Upload** `uploadProductImage` -> Storage `product-images`.
4. **Montagem do prompt** `buildUserPayload` + `SYSTEM_ML_LISTING_V3`.
5. **Gemini** `generateListingJson` com `responseMimeType: application/json`.
6. **Parse + Zod** `listingAiOutputSchema`; em falha de schema, **uma tentativa de reparo** com `repairHint` (ver `aiListingService`).
7. **Pos-processamento semantico** `semanticPostProcess` (titulo, keywords, etc.).
8. **Persistencia** `listings` insert com `outputs`, paths de imagem, hash.
9. **Uso** `incrementUsageAfterSuccessfulGeneration` ou consumo de credito extra conforme gate.

## Historico

- Listagem de anuncios vem da tabela `listings`; nao ha thread de chat persistido.

## Controle de consumo

- Incremento apos sucesso; falhas antes do insert nao debitam ciclo (exceto se politica mudar - hoje centrado no sucesso).

## Links

- [Modelo e prompts](./modelo-prompts-e-resiliencia.md)
- [Backend servicos](../backend/servicos-internos.md)
