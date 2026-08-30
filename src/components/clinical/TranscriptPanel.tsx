"use client";

import { useEffect, useRef } from "react";
import { AlignLeft } from "lucide-react";

interface TranscriptPanelProps {
  transcript: string;
  isTranscribing: boolean;
  className?: string;
}

export function TranscriptPanel({
  transcript,
  isTranscribing,
  className,
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript, isTranscribing]);

  return (
    <section
      data-testid="transcript-panel"
      className={`flex min-h-0 flex-col gap-5 rounded-xl border border-border bg-surface p-5 md:p-6 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlignLeft className="h-[18px] w-[18px] text-primary" aria-hidden />
          <h2 className="text-base font-bold text-heading">Transcrição Contínua</h2>
        </div>
        <span className="text-xs text-text-muted">Idioma: Pt-BR</span>
      </div>

      <div
        ref={containerRef}
        onScroll={() => {
          const el = containerRef.current;
          if (!el) return;
          const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
          stickToBottomRef.current = distance < 80;
        }}
        aria-live="polite"
        aria-label="Transcrição da consulta"
        className="min-h-[14rem] flex-1 overflow-y-auto pr-1"
      >
        {transcript ? (
          <p className="animate-fade-in whitespace-pre-wrap text-[15px] leading-6 text-text-body">
            {transcript}
          </p>
        ) : (
          <p className="text-[15px] leading-6 text-text-muted">
            A transcrição aparecerá aqui conforme a conversa for capturada.
          </p>
        )}

        {isTranscribing ? (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[15px] leading-6 text-text-muted opacity-60">
              Transcrevendo o trecho mais recente…
            </p>
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
