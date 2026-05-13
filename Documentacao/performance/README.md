# Performance

## Frontend

- Preferir **Server Components** para dados estaticos/listas.
- Client apenas onde necessario (forms, tabelas interativas).
- `DashboardShell` persiste estado de sidebar em `localStorage` (evita flicker).

## Backend

- **Gemini**: timeout 60s, retries limitados - evita filas longas sem retorno.
- **Imagens**: limite de bytes reduz latencia e custo.
- Queries Supabase: usar `.eq` em PK/indices (`user_id`, `period`).

## Gargalos conhecidos

- Chamada Gemini e serial por geracao (sem fila distribuida).
- Lista de usuarios admin carrega todos perfis (considerar paginacao futura).

## Melhorias futuras

- Paginacao / cursor em listas admin.
- Cache de leitura de `plans` (raramente muda).
- CDN para assets estaticos (Next padrao).

## Links

- [IA modelo](../ia/modelo-prompts-e-resiliencia.md)
- [Analise tecnica](../analise/analise-tecnica.md)

[Voltar](../README.md)
