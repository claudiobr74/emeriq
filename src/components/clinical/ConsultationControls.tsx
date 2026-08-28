"use client";

import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionPhase } from "@/types/clinical";

interface ConsultationControlsProps {
  phase: SessionPhase;
  onPause: () => void;
  onResume: () => void;
  onFinalize: () => void;
}

export function ConsultationControls({
  phase,
  onPause,
  onResume,
  onFinalize,
}: ConsultationControlsProps) {
  const busy = phase === "finalizing" || phase === "starting";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
      {phase === "paused" ? (
        <Button type="button" variant="secondary" onClick={onResume} disabled={busy}>
          <Play />
          Retomar
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={onPause}
          disabled={busy || phase !== "listening"}
        >
          <Pause />
          Pausar
        </Button>
      )}
      <Button
        type="button"
        variant="destructive"
        onClick={onFinalize}
        disabled={busy}
      >
        <Square />
        Finalizar atendimento
      </Button>
    </div>
  );
}
