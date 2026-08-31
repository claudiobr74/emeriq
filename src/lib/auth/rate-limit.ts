/** Limitador in-process (sem Redis). Por instância serverless. */
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;

const failures = new Map<string, { count: number; resetAt: number }>();

export function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function loginRateLimitKey(ip: string, email: string): string {
  return `${ip}|${normalizeLoginEmail(email)}`;
}

export function peekLoginRateLimit(key: string): {
  ok: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  const current = failures.get(key);
  if (!current || current.resetAt <= now) {
    if (current) failures.delete(key);
    return { ok: true, retryAfterMs: 0 };
  }
  if (current.count >= MAX_FAILURES) {
    return { ok: false, retryAfterMs: current.resetAt - now };
  }
  return { ok: true, retryAfterMs: 0 };
}

/** Conta só falha de credencial (401). Sucesso, 429 do Appwrite e 5xx não entram. */
export function recordFailedLogin(key: string): {
  ok: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  const current = failures.get(key);
  if (!current || current.resetAt <= now) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterMs: 0 };
  }
  current.count += 1;
  if (current.count >= MAX_FAILURES) {
    return { ok: false, retryAfterMs: current.resetAt - now };
  }
  return { ok: true, retryAfterMs: 0 };
}

export function clearLoginFailures(key: string): void {
  failures.delete(key);
}

/** Uso exclusivo de testes (vitest). */
export function resetLoginRateLimitStore(): void {
  failures.clear();
}

export const LOGIN_RATE_LIMIT = {
  windowMs: WINDOW_MS,
  maxFailures: MAX_FAILURES,
} as const;
