"use client";

import { Loader2, Mic } from "lucide-react";

export function MicPermissionScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Mic className="h-8 w-8 text-primary" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-heading">
          Ativando microfone
        </h1>
        <p className="mt-3 max-w-sm text-[15px] leading-6 text-text-secondary">
          Permita o acesso ao microfone no seu navegador para iniciar a escuta e
          transcrição automatizada da consulta.
        </p>
        <div
          role="status"
          aria-live="polite"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-body"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          Aguardando permissão do sistema…
        </div>
      </div>
    </div>
  );
}
