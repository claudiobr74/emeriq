"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

export function RecoverConfirmScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const userId = params.get("userId") ?? params.get("user_id") ?? "";
  const secret = params.get("secret") ?? "";
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== repeat) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/recover/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret, password }),
      });
      if (!response.ok) {
        setError("Não foi possível redefinir a senha.");
        return;
      }
      setDone(true);
      window.setTimeout(() => router.replace("/login"), 1200);
    } catch {
      setError("Falha de conexão. Verifique a rede e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="flex w-full max-w-[440px] flex-col gap-6 rounded-2xl border border-border bg-surface p-8">
        <Logo />
        <h1 className="text-xl font-bold text-heading">Redefinir senha</h1>
        {!userId || !secret ? (
          <p className="text-sm text-text-body">
            Link inválido ou incompleto. Solicite uma nova recuperação de senha.
          </p>
        ) : done ? (
          <p className="text-sm text-text-body">Senha atualizada. Redirecionando…</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-text-body">Nova senha</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-text-body">
                Confirmar senha
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm"
              />
            </label>
            {error ? (
              <p className="text-sm text-critical" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Salvando…" : "Salvar senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
