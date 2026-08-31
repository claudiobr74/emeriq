import type { LoginFailureCode } from "@/lib/auth/types";

export function formatLoginError(
  code: LoginFailureCode,
  message: string,
  retryAfterSeconds?: number,
): string {
  if (code !== "rate_limited") return message;
  const seconds = retryAfterSeconds ?? 0;
  if (seconds <= 0) return message;
  if (seconds >= 120) {
    return `Muitas tentativas. Aguarde ${Math.ceil(seconds / 60)} minutos.`;
  }
  if (seconds >= 60) return "Muitas tentativas. Aguarde 1 minuto.";
  return `Muitas tentativas. Aguarde ${seconds} segundos.`;
}
