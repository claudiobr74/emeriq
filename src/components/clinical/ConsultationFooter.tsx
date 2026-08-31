"use client";

import { CheckCheck, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionPhase } from "@/types/clinical";

interface ConsultationFooterProps {
  phase: SessionPhase;
  onPause: () => void;
  onResume: () => void;
  onFinalize: () => void;
}

export function ConsultationFooter({
  phase,
  onPause,
  onResume,
  onFinalize,
}: ConsultationFooterProps) {
  const busy = phase === "finalizing" || phase === "starting";
  const paused = phase === "paused";

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 md:px-8 md:py-4">
      {paused ? (
        <Button variant="secondary" onClick={onResume} disabled={busy}>
          <PlayCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Retomar transcrição</span>
          <span className="sm:hidden">Retomar</span>
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={onPause}
          disabled={busy || phase !== "listening"}
        >
          <PauseCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Pausar transcrição</span>
          <span className="sm:hidden">Pausar</span>
        </Button>
      )}

      <Button onClick={onFinalize} disabled={busy} data-testid="finish-consultation">
        <CheckCheck className="h-4 w-4" />
        <span className="hidden sm:inline">Finalizar atendimento</span>
        <span className="sm:hidden">Finalizar</span>
      </Button>
    </div>
  );
}
