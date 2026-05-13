/** @module src/lib/errors.ts */

export function mapListingError(code: string): string {
  switch (code) {
    case "UNAUTHORIZED":
      return "Sessão expirada. Faça login novamente.";
    case "VALIDATION":
      return "Verifique os campos do formulário.";
    case "IMAGE_REQUIRED":
      return "Envie uma imagem do produto.";
    case "IMAGE_TOO_LARGE":
      return "Imagem muito grande. Use até 2 MB (JPEG, PNG ou WebP).";
    case "IMAGE_TYPE_UNSUPPORTED":
      return "Formato de imagem não suportado. Use JPEG, PNG ou WebP.";
    case "MONTHLY_LIMIT_REACHED":
      return "Limite do ciclo atual e créditos extras esgotados. Compre créditos extras (não expiram), assine um plano ou aguarde a renovação do ciclo.";
    case "USER_BLOCKED":
      return "Sua conta está suspensa. Entre em contato com o suporte.";
    case "SUBSCRIPTION_INACTIVE":
      return "Sua assinatura não está ativa e você não tem créditos extras. Assine um plano ou compre créditos na página Planos.";
    case "AI_OUTPUT_INVALID":
      return "Não foi possível validar a resposta da IA. Tente novamente.";
    case "GEMINI_FAILED":
      return "Falha ao contactar o serviço de IA. Tente novamente em instantes.";
    case "GEMINI_API_KEY_MISSING":
      return "Configuração do servidor incompleta (IA). Contate o suporte.";
    default:
      return "Algo deu errado. Tente novamente.";
  }
}

/** Rótulo amigável para `error_code` persistido (evita expor nomes internos do provedor). */
export function listingErrorCodeLabel(
  code: string | null | undefined,
): string {
  if (!code) return "desconhecido";
  switch (code) {
    case "GEMINI_FAILED":
      return "falha na chamada de IA";
    case "GEMINI_API_KEY_MISSING":
      return "credenciais de IA ausentes no servidor";
    case "AI_OUTPUT_INVALID":
      return "resposta da IA não passou na validação";
    default:
      return code;
  }
}
