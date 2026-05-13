# Variaveis de ambiente

| Nome | Onde | Obrigatoria | Descricao |
|------|------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | sim | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente + servidor | sim | Chave anon |
| `GEMINI_API_KEY` | servidor apenas | sim para geracao | API Google Generative AI |
| `GEMINI_MODEL` | servidor | nao | Override do modelo (default `gemini-2.5-flash`) |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | nao no fluxo atual | Reservada para jobs futuros |

**Nunca** expor `SERVICE_ROLE` ou `GEMINI_API_KEY` em `NEXT_PUBLIC_*`.

## Arquivo local

Use `.env` ou `.env.local` (gitignored). Nao commitar segredos.

## Links

- [Seguranca](../seguranca/README.md)
