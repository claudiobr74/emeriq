"use client";

import { useCallback, useState } from "react";
import type { AuthUser, LoginFailureCode } from "@/lib/auth/types";
import { clearConsultationId } from "@/lib/consultations/browser";

export function useAuth(initialUser: AuthUser | null = null) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as {
        user?: AuthUser;
        error?: string;
        code?: LoginFailureCode;
      } | null;
      if (!response.ok || !payload?.user) {
        return {
          ok: false as const,
          code: (payload?.code ??
            (response.status === 429
              ? "rate_limited"
              : "unknown_error")) as LoginFailureCode,
          message: payload?.error ?? "Não foi possível entrar agora. Tente novamente.",
        };
      }
      setUser(payload.user);
      return { ok: true as const, user: payload.user };
    } catch {
      return {
        ok: false as const,
        code: "network_error" as const,
        message: "Falha de conexão. Verifique a rede e tente novamente.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* still clear local */
    }
    clearConsultationId();
    setUser(null);
    window.location.href = `${window.location.origin}/login`;
  }, []);

  return {
    user,
    loading,
    authenticated: Boolean(user),
    login,
    logout,
  };
}
