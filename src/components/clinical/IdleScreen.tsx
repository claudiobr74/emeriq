"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IdleScreenProps {
  starting: boolean;
  error: string | null;
  onStart: () => void;
}

export function IdleScreen({ starting, error, onStart }: IdleScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Assistente de Pronto-Socorro
        </h1>
        <p className="mt-3 text-base text-slate-600 md:text-lg">
          Transcrição e apoio clínico durante o atendimento.
        </p>
        <div className="mt-8">
          <Button size="xl" onClick={onStart} disabled={starting}>
            <Mic />
            {starting ? "Iniciando microfone…" : "Iniciar atendimento"}
          </Button>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-red-700">{error}</p>
        ) : null}
        <p className="mt-8 text-sm leading-6 text-slate-500">
          Ferramenta de apoio ao profissional médico. As sugestões devem ser
          avaliadas no contexto clínico.
        </p>
      </div>
    </div>
  );
}
