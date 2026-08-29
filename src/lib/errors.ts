export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 500,
    public readonly retryAfterMs?: number,
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
  if (error instanceof AppError && error.retryAfterMs != null) return true;
  const message = error instanceof Error ? error.message : String(error);
  if (/Request too large|payload too|413/i.test(message)) return false;
  return /429|rate.?limit|limite de uso|timeout|ETIMEDOUT|ECONNRESET|503|temporariamente|too many/i.test(
    message,
  );
}

export function groqRetryAfterMs(error: unknown): number | undefined {
  const raw = error instanceof Error ? error.message : String(error);
  const match = raw.match(/try again in ([\d.]+)\s*(ms|s|m)?/i);
  if (!match) {
    const status = (error as { status?: number }).status;
    if (status === 429 || /rate_limit_exceeded/i.test(raw)) return 65_000;
    return undefined;
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  if (unit === "ms") return Math.max(1_000, Math.ceil(amount));
  if (unit === "m") return Math.ceil(amount * 60_000);
  return Math.max(1_000, Math.ceil(amount * 1_000));
}
