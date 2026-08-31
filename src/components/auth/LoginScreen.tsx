"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutMode } from "@/hooks/useLayoutMode";
import type { LoginStatus } from "@/lib/auth/types";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const COPY = {
  desktop: {
    title: "Entrar no EmerIQ",
    subtitle: "Insira suas credenciais médicas para continuar",
    emailLabel: "E-mail institucional",
    emailPlaceholder: "medico@hospital.org",
    passwordLabel: "Senha de acesso",
    submit: "Entrar",
    buttonFull: false,
    forgotUnderline: true,
  },
  tablet: {
    title: "Entrar no sistema",
    subtitle: "Acesso exclusivo para médicos autorizados",
    emailLabel: "E-mail ou Usuário",
    emailPlaceholder: "rodrigo.silva@hospital.com",
    passwordLabel: "Senha",
    submit: "Entrar",
    buttonFull: true,
    forgotUnderline: false,
  },
  mobile: {
    title: "Entrar no EmerIQ",
    subtitle: null as string | null,
    emailLabel: "E-mail profissional",
    emailPlaceholder: "exemplo@hospital.com",
    passwordLabel: "Senha",
    submit: "Acessar sistema",
    buttonFull: true,
    forgotUnderline: false,
  },
} as const;

function emailInvalid(value: string): boolean {
  return !z.email().safeParse(value.trim()).success;
}

interface FormProps {
  layout: LayoutMode;
  email: string;
  password: string;
  showPassword: boolean;
  status: LoginStatus;
  error: string | null;
  emailError: boolean;
  passwordError: boolean;
  mode: "login" | "recover";
  recoverSent: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onRecover: (event: React.FormEvent) => void;
  onForgot: () => void;
  onBack: () => void;
}

function LoginForm({
  layout,
  email,
  password,
  showPassword,
  status,
  error,
  emailError,
  passwordError,
  mode,
  recoverSent,
  onEmail,
  onPassword,
  onTogglePassword,
  onSubmit,
  onRecover,
  onForgot,
  onBack,
}: FormProps) {
  const copy = COPY[layout];
  const submitting = status === "submitting";
  const invalid = status === "invalid_credentials";
  const compact = layout !== "desktop";
  const labelClass = compact
    ? "text-[12px] font-semibold text-text-body"
    : "text-[13px] font-semibold text-text-body";
  const fieldGap = compact ? "gap-1.5" : "gap-2";
  const eyeSize = layout === "tablet" ? 16 : 18;
  const inputClass = `w-full rounded-lg border bg-surface-muted ${
    compact ? "p-3" : "px-4 py-3"
  } text-sm text-text outline-none transition-colors placeholder:text-text-muted ${
    invalid || emailError ? "border-critical" : "border-border focus:border-primary"
  }`;
  const passwordInputClass = `w-full rounded-lg border bg-surface-muted py-3 pr-11 text-sm text-text outline-none transition-colors placeholder:text-text-muted ${
    compact ? "pl-3" : "pl-4"
  } ${invalid || passwordError ? "border-critical" : "border-border focus:border-primary"}`;

  return (
    <form
      onSubmit={mode === "login" ? onSubmit : onRecover}
      className="flex w-full flex-col"
      method="post"
      action="#"
      noValidate
    >
      <div className={`flex flex-col ${layout === "desktop" ? "gap-5" : "gap-4"}`}>
        <label className={`flex flex-col ${fieldGap}`}>
          <span className={labelClass}>{copy.emailLabel}</span>
          <input
            type="email"
            name={`email-${layout}`}
            autoComplete="username"
            inputMode="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            disabled={submitting}
            onChange={(event) => onEmail(event.target.value)}
            className={inputClass}
            aria-invalid={emailError || invalid}
          />
        </label>
        {mode === "login" ? (
          <label className={`flex flex-col ${fieldGap}`}>
            <span className={labelClass}>{copy.passwordLabel}</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                name={`password-${layout}`}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                disabled={submitting}
                onChange={(event) => onPassword(event.target.value)}
                className={passwordInputClass}
                aria-invalid={passwordError || invalid}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                style={{ width: eyeSize, height: eyeSize }}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={onTogglePassword}
              >
                <Image
                  src={showPassword ? "/brand/icon-eye-off.svg" : "/brand/icon-eye.svg"}
                  alt=""
                  width={eyeSize}
                  height={eyeSize}
                />
              </button>
            </span>
          </label>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-critical" role="alert">
          {error}
        </p>
      ) : null}
      {recoverSent && mode === "recover" ? (
        <p className="mt-3 text-sm text-text-body" role="status">
          Se existir uma conta, enviaremos um e-mail com instruções.
        </p>
      ) : null}

      <div
        className={`flex flex-col items-center ${
          layout === "desktop" ? "mt-8 gap-4" : "mt-6 gap-4"
        }`}
      >
        <button
          type="submit"
          disabled={submitting}
          className={`rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 ${
            copy.buttonFull ? "w-full py-3.5" : ""
          }`}
        >
          {submitting
            ? mode === "recover"
              ? "Enviando…"
              : "Entrando…"
            : mode === "recover"
              ? "Enviar instruções"
              : copy.submit}
        </button>
        {mode === "login" ? (
          <button
            type="button"
            className={`text-[13px] font-medium text-primary ${
              copy.forgotUnderline ? "underline" : ""
            }`}
            onClick={onForgot}
          >
            Esqueceu sua senha?
          </button>
        ) : (
          <button
            type="button"
            className="text-[13px] font-medium text-primary"
            onClick={onBack}
          >
            Voltar ao login
          </button>
        )}
      </div>
    </form>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [mode, setMode] = useState<"login" | "recover">("login");
  const [recoverSent, setRecoverSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEmailError(false);
    setPasswordError(false);
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setEmailError(!email.trim() || emailInvalid(email));
      setPasswordError(!password);
      setStatus("invalid_credentials");
      setError("E-mail ou senha inválidos.");
      return;
    }
    setStatus("submitting");
    setError(null);
    const result = await login(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      setStatus(result.code);
      setError(result.message);
      return;
    }
    setStatus("success");
    router.replace("/");
    router.refresh();
  }

  async function onRecover(event: React.FormEvent) {
    event.preventDefault();
    const parsed = z.email().safeParse(email.trim());
    if (!parsed.success) {
      setEmailError(true);
      setError("Informe um e-mail válido.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data }),
      });
      setRecoverSent(true);
      setStatus("idle");
    } catch {
      setStatus("network_error");
      setError("Falha de conexão. Verifique a rede e tente novamente.");
    }
  }

  const formProps = {
    email,
    password,
    showPassword,
    status,
    error,
    emailError,
    passwordError,
    mode,
    recoverSent,
    onEmail: (value: string) => {
      setEmail(value);
      setEmailError(false);
      if (status !== "submitting") setStatus("idle");
      setError(null);
    },
    onPassword: (value: string) => {
      setPassword(value);
      setPasswordError(false);
      if (status !== "submitting") setStatus("idle");
      setError(null);
    },
    onTogglePassword: () => setShowPassword((value) => !value),
    onSubmit,
    onRecover,
    onForgot: () => {
      setMode("recover");
      setError(null);
      setRecoverSent(false);
      setStatus("idle");
    },
    onBack: () => {
      setMode("login");
      setRecoverSent(false);
      setError(null);
      setStatus("idle");
    },
  };

  return (
    <div data-login-screen>
      <div className="hidden min-h-dvh min-[1024px]:flex flex-col items-center justify-between bg-bg">
        <div className="h-10 w-full" />
        <div className="flex w-[440px] flex-col gap-8 rounded-2xl border border-border bg-surface p-10 shadow-[0_4px_10px_rgba(17,22,37,0.05)]">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold text-heading">{COPY.desktop.title}</h1>
            <p className="text-sm text-text-body">{COPY.desktop.subtitle}</p>
          </div>
          <LoginForm layout="desktop" {...formProps} />
        </div>
        <p className="p-6 text-center text-[11px] text-text-muted">
          EmerIQ Plataforma Segura • Em conformidade com a LGPD e regulamentações CFM
        </p>
      </div>

      <div className="hidden min-h-dvh min-[640px]:max-[1023px]:flex flex-col items-center justify-between bg-bg">
        <header className="flex w-full items-center border-b border-border bg-surface px-8 py-4">
          <Logo />
        </header>
        <div className="flex w-[420px] flex-col items-center gap-7 rounded-2xl border border-border bg-surface p-10">
          <Logo />
          <div className="flex w-full flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-bold text-text">{COPY.tablet.title}</h1>
            <p className="text-[13px] text-text-body">{COPY.tablet.subtitle}</p>
          </div>
          <LoginForm layout="tablet" {...formProps} />
        </div>
        <div className="h-20 w-full" />
      </div>

      <div className="flex min-h-dvh flex-col bg-bg px-6 pb-6 pt-10 min-[640px]:hidden">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
          <h1 className="text-xl font-bold text-heading">{COPY.mobile.title}</h1>
          <LoginForm layout="mobile" {...formProps} />
        </div>
      </div>
    </div>
  );
}
