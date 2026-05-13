# Escalonamento SaaS

## Curto prazo

- Paginacao em listas admin.
- Fila assincrona para geracao (worker + status `processing`) se volume crescer.

## Medio prazo

- Gateway de pagamento + webhooks (ex.: Stripe) espelhando estado em `profiles`.
- Rate limit na borda (Vercel Firewall, Cloudflare).

## Longo prazo

- Multi-tenant organizacional (times) com RLS por `org_id`.
- Observabilidade: OpenTelemetry, export de logs estruturados.

## Links

- [Performance](../performance/README.md)
- [Seguranca](../seguranca/README.md)
