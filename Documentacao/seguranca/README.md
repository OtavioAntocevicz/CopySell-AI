# Seguranca

## Camadas

1. **RLS Postgres**: todas as tabelas de dados de usuario protegidas por `auth.uid()` e/ou `is_admin()`.
2. **Trigger `profiles_privileged_update_guard`**: impede usuario de alterar plano, role, bloqueio, etc.
3. **Storage policies**: path obrigatorio `users/{uid}/...`.
4. **Server Actions**: validacao de entrada e checagem de sessao antes de mutar.

## Upload

- MIME allowlist (`ALLOWED_IMAGE_MIMES`).
- Tamanho maximo global e por plano.
- Objetos privados - leitura apenas dono (e admin conforme policy).

## Sanitizacao e validacao

- Zod em formularios criticos (listing, perfil, billing requests).
- Pos-processamento semantico reduz claims perigosos (`dangerous-claims`, etc.).

## Anti-spam / rate limit

- **Limites de negocio**: geracoes por ciclo + creditos.
- **Rate limit HTTP**: nao implementado globalmente nesta versao - considerar WAF / edge limiter ao escalar.

## Variaveis

- Ver [deploy/variaveis-ambiente.md](../deploy/variaveis-ambiente.md).

## Links

- [Banco RLS](../banco/tabelas-e-relacoes.md)
- [IA custos e abuso](../ia/modelo-prompts-e-resiliencia.md)

[Voltar](../README.md)
