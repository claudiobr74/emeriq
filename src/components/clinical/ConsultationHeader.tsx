"use client";

import { Settings } from "lucide-react";
import { formatElapsed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DisplayStatus } from "@/types/clinical";

const STATUS_LABEL: Record<DisplayStatus, string> = {
  idle: "Parado",
  starting: "Iniciando microfone",
  listening: "Ouvindo",
  transcribing: "Transcrevendo",
  paused: "Pausado",
  processing: "Processando",
  finalizing: "Processando",
  completed: "Concluído",
  error: "Erro",
};

function statusColor(status: DisplayStatus): string {
  if (status === "error") return "bg-red-600";
  if (status === "listening" || status === "transcribing") return "bg-emerald-600";
  if (status === "processing" || status === "finalizing" || status === "starting") {
    return "bg-amber-500";
  }
  if (status === "paused") return "bg-slate-400";
  return "bg-slate-300";
}

interface ConsultationHeaderProps {
  status: DisplayStatus;
  elapsedMs: number;
  onOpenSettings: () => void;
}

export function ConsultationHeader({
  status,
  elapsedMs,
  onOpenSettings,
}: ConsultationHeaderProps) {
  const live = status === "listening" || status === "transcribing";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div>
        <p className="text-lg font-semibold tracking-tight text-slate-900">
          PS Assist
        </p>
        <p className="text-sm text-slate-500">Assistente clínica em tempo real</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            {live ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            ) : null}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusColor(status)}`}
            />
          </span>
          <span className="text-sm font-medium text-slate-800">
            {STATUS_LABEL[status]}
          </span>
          {status !== "idle" ? (
            <span className="font-mono text-sm text-slate-600">
              {formatElapsed(elapsedMs)}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Configurações"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
