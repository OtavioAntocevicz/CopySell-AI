/** @module src/lib/listingFailure.ts */

import { mapListingError } from "@/lib/errors";

/** Remove possíveis trechos sensíveis antes de mostrar na UI. */
function redactSecrets(text: string): string {
  return text.replace(/AIza[\w-]{20,}/gi, "[API_KEY]").slice(0, 280);
}

function getUnderlyingMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Converte falhas do pipeline (IA, Supabase, upload) em texto útil para o usuário.
 */
export function explainListingFailure(err: unknown): string {
  const msg = getUnderlyingMessage(err);
  const lower = msg.toLowerCase();

  if (msg === "IMAGE_TOO_LARGE") return mapListingError("IMAGE_TOO_LARGE");
  if (msg === "IMAGE_TYPE_UNSUPPORTED") return mapListingError("IMAGE_TYPE_UNSUPPORTED");
  if (msg === "USER_BLOCKED") return mapListingError("USER_BLOCKED");
  if (msg === "SUBSCRIPTION_INACTIVE") {
    return mapListingError("SUBSCRIPTION_INACTIVE");
  }
  if (msg === "MONTHLY_LIMIT_REACHED") {
    return mapListingError("MONTHLY_LIMIT_REACHED");
  }
  if (msg === "EXTRA_CREDIT_DECREMENT_FAILED") {
    return "Não foi possível registrar o uso do crédito extra. Atualize a página e tente de novo ou contate o suporte.";
  }
  if (msg === "AI_OUTPUT_INVALID") return mapListingError("AI_OUTPUT_INVALID");

  if (
    lower.includes("violates row-level security") ||
    lower.includes("row-level security")
  ) {
    return "O Supabase bloqueou o salvamento (RLS). Confira se as políticas da tabela `listings` foram aplicadas na migration.";
  }

  if (
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("could not find the table")
  ) {
    return "Tabela não encontrada no Supabase. Execute o SQL da pasta `supabase/migrations` no SQL Editor.";
  }

  if (
    lower.includes("product-images") ||
    (lower.includes("bucket") && lower.includes("not found"))
  ) {
    return "Bucket de imagens ausente ou incorreto. No Supabase Storage crie o bucket privado `product-images` ou rode a migration completa.";
  }

  if (lower.includes("aborted") || msg === "AbortError") {
    return "Tempo esgotado ao chamar a IA. Tente uma imagem menor ou aguarde e tente de novo.";
  }

  if (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests")
  ) {
    return "Limite ou quota do provedor de IA atingida. Aguarde alguns minutos ou verifique cota e faturamento no painel do provedor.";
  }

  if (
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("service unavailable") ||
    lower.includes("high demand")
  ) {
    return "O serviço de IA está temporariamente sobrecarregado (alta demanda). Aguarde um minuto e tente de novo. Se repetir, confira no servidor o modelo configurado e a documentação do provedor.";
  }

  if (
    lower.includes("api key") ||
    lower.includes("permission_denied") ||
    lower.includes("invalid api") ||
    lower.includes("unauthorized")
  ) {
    return "Chave de API do provedor de IA inválida ou sem permissão. Confira as credenciais no ambiente do servidor e reinicie o app.";
  }

  if (
    lower.includes("not found") &&
    (lower.includes("model") || lower.includes("models/"))
  ) {
    return "O modelo de IA configurado no servidor não está disponível ou não está liberado para sua chave. Ajuste a variável de modelo no ambiente conforme a documentação do provedor e reinicie o app.";
  }

  if (
    lower.includes("blocked") ||
    lower.includes("safety") ||
    lower.includes("harm_category")
  ) {
    return "A IA recusou gerar por políticas de segurança. Use outra foto ou descrição mais neutra.";
  }

  const safe = redactSecrets(msg);
  return `${mapListingError("GEMINI_FAILED")} ${safe ? `(${safe})` : ""}`.trim();
}
