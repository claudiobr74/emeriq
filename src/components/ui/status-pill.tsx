import { cn } from "@/lib/utils";
import type { DisplayStatus } from "@/types/clinical";

type Tone = "recording" | "neutral" | "processing" | "critical";

interface PillConfig {
  label: string;
  tone: Tone;
  pulse: boolean;
}

function configFor(status: DisplayStatus): PillConfig | null {
  switch (status) {
    case "listening":
    case "transcribing":
      return { label: "Ouvindo", tone: "recording", pulse: true };
    case "paused":
      return { label: "Pausado", tone: "neutral", pulse: false };
    case "processing":
    case "finalizing":
      return { label: "Processando", tone: "processing", pulse: true };
    case "starting":
      return { label: "Iniciando", tone: "processing", pulse: true };
    case "error":
      return { label: "Erro", tone: "critical", pulse: false };
    default:
      return null;
  }
}

const TONES: Record<Tone, { pill: string; dot: string }> = {
  recording: {
    pill: "bg-critical-bg border-critical text-critical",
    dot: "bg-critical",
  },
  neutral: {
    pill: "bg-surface-muted border-border text-text-secondary",
    dot: "bg-text-muted",
  },
  processing: {
    pill: "bg-warning-bg border-warning text-warning",
    dot: "bg-warning",
  },
  critical: {
    pill: "bg-critical-bg border-critical text-critical",
    dot: "bg-critical",
  },
};

export function StatusPill({
  status,
  className,
}: {
  status: DisplayStatus;
  className?: string;
}) {
  const config = configFor(status);
  if (!config) return null;
  const tone = TONES[config.tone];

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold",
        tone.pill,
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse ? (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              tone.dot,
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", tone.dot)} />
      </span>
      {config.label}
    </span>
  );
}
