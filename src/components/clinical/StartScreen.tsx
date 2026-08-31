"use client";

import Image from "next/image";
import { MicOff, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StartScreenProps {
  starting: boolean;
  error: string | null;
  onStart: () => void;
}

export function StartScreen({ starting, error, onStart }: StartScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-8 w-8 text-primary" aria-hidden />
        </div>

        <div className="mt-6 rounded-xl bg-surface px-6 py-4 shadow-sm">
          <Image
            src="/brand/emeriq-logo-full.svg"
            alt="EmerIQ"
            width={132}
            height={99}
            priority
            className="h-[72px] w-auto"
          />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-heading sm:text-[26px]">
          Assistente clínica em tempo real para pronto-socorro
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-6 text-text-secondary">
          Ouve, transcreve e acompanha o raciocínio clínico de forma contínua
          durante todo o atendimento no ambiente de emergência.
        </p>

        <div className="mt-8 w-full max-w-xs">
          <Button
            size="xl"
            className="w-full"
            onClick={onStart}
            disabled={starting}
            data-testid="start-consultation"
          >
            <PlayCircle className="h-5 w-5" />
            {starting ? "Iniciando…" : "Iniciar atendimento"}
          </Button>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-5 flex w-full items-start gap-3 rounded-lg border border-critical bg-critical-bg px-4 py-3 text-left"
          >
            <MicOff className="mt-0.5 h-5 w-5 shrink-0 text-critical" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-critical">
                Não foi possível iniciar a captação de áudio
              </p>
              <p className="mt-1 text-[13px] leading-5 text-text-body">{error}</p>
            </div>
          </div>
        ) : (
          <p className="mt-5 flex items-center gap-2 text-[13px] font-medium text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
            Pronto para escuta ativa e diagnóstico assistido
          </p>
        )}
      </div>

      <div className="mt-12 w-full max-w-2xl">
        <div className="flex items-start justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-center">
          <p className="text-[12px] leading-5 text-text-secondary">
            Ferramenta de apoio ao profissional médico. As sugestões clínicas e
            diagnósticas devem ser sempre avaliadas sob o julgamento e contexto
            clínico soberano do médico.
          </p>
        </div>
      </div>
    </div>
  );
}
