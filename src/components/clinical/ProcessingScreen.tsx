"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ShieldAlert } from "lucide-react";

const STEPS = [
  "Consolidando informações",
  "Revisando dados clínicos",
  "Estruturando SOAP",
];

/**
 * Representa as fases conceituais da finalização real (seção 40). Não exibe
 * porcentagem inventada: os dois primeiros passos avançam enquanto o pedido
 * real de finalização executa; o último permanece ativo até o SOAP retornar
 * (quando esta tela é desmontada).
 */
export function ProcessingScreen() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setActive(1), 1200);
    const t2 = window.setTimeout(() => setActive(2), 2600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="h-8 w-8 text-primary" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-heading">
          Preparando resumo clínico
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-text-secondary">
          Aguarde alguns segundos enquanto a IA estrutura os dados no modelo SOAP.
        </p>

        <div
          className="mt-8 w-full rounded-xl border border-border bg-surface p-5 text-left shadow-sm"
          role="status"
          aria-live="polite"
        >
          <ul className="space-y-3">
            {STEPS.map((step, index) => {
              const done = index < active;
              const current = index === active;
              return (
                <li key={step} className="flex items-center gap-3">
                  {done ? (
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                  ) : current ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                  ) : (
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      aria-hidden
                    />
                  )}
                  <span
                    className={
                      current
                        ? "text-sm font-semibold text-primary"
                        : done
                          ? "text-sm text-text"
                          : "text-sm text-text-muted"
                    }
                  >
                    {step}…
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
