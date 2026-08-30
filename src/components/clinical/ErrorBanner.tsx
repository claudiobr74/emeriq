"use client";

import { AlertTriangle, Cpu, WifiOff } from "lucide-react";

type ErrorKind = "transcription" | "clinical" | "connection";

const ICONS = {
  transcription: AlertTriangle,
  clinical: Cpu,
  connection: WifiOff,
} as const;

/**
 * Banner de falha não bloqueante durante a consulta. Falha de IA/transcrição
 * não interrompe a captura (seção 47). Segue o tom "warning" dos error states
 * do Figma (5:1531).
 */
export function ErrorBanner({
  kind = "clinical",
  message,
}: {
  kind?: ErrorKind;
  message: string;
}) {
  const Icon = ICONS[kind];
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 border-b border-warning/40 bg-warning-bg px-4 py-2.5 md:px-8"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      <p className="text-[13px] leading-5 text-text-body">{message}</p>
    </div>
  );
}
