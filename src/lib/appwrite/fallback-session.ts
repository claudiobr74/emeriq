/** Extrai o token de sessão do header `X-Fallback-Cookies` (login sem API key). */
export function sessionTokenFromFallbackCookies(
  header: string | null | undefined,
  projectId: string,
): string | undefined {
  if (!header?.trim() || !projectId) return undefined;
  try {
    const parsed = JSON.parse(header) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    const record = parsed as Record<string, unknown>;
    const raw =
      record[`a_session_${projectId}`] ??
      record[`a_session_${projectId}_legacy`];
    return typeof raw === "string" && raw.length > 0 ? raw : undefined;
  } catch {
    return undefined;
  }
}
