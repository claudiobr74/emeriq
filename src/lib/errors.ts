export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Permissão de microfone recusada. Autorize o microfone para iniciar o atendimento.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Nenhum microfone foi encontrado neste dispositivo.";
    }
    if (error.name === "NotReadableError" || error.name === "AbortError") {
      return "O microfone está indisponível ou em uso por outro aplicativo.";
    }
  }
  return "Não foi possível iniciar o microfone.";
}

export function apiErrorMessage(status: number, fallback: string): string {
  if (status === 401 || status === 403) {
    return "Falha de autenticação com o serviço de IA. Verifique a chave GROQ_API_KEY.";
  }
  if (status === 429) {
    return "Limite de uso do serviço de IA atingido. A gravação continua.";
  }
  if (status >= 500) {
    return "Serviço de IA temporariamente indisponível.";
  }
  return fallback;
}

export function isRetryableClinicalError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|limite de uso|excedeu o limite|timeout|ETIMEDOUT|ECONNRESET|503|temporariamente|too many|tokens/i.test(
    message,
  );
}
