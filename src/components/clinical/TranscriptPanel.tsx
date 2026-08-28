"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TranscriptPanelProps {
  transcript: string;
  isTranscribing: boolean;
}

export function TranscriptPanel({
  transcript,
  isTranscribing,
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript, isTranscribing]);

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <CardTitle>Transcrição</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div
          ref={containerRef}
          onScroll={() => {
            const el = containerRef.current;
            if (!el) return;
            const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
            stickToBottomRef.current = distance < 80;
          }}
          className="min-h-[16rem] flex-1 overflow-y-auto rounded-lg bg-slate-50 p-4 text-[15px] leading-7 text-slate-800"
        >
          {transcript ? (
            <p className="whitespace-pre-wrap">{transcript}</p>
          ) : (
            <p className="text-slate-400">
              A transcrição aparecerá aqui conforme a conversa for capturada.
            </p>
          )}
          {isTranscribing ? (
            <p className="mt-3 text-sm text-teal-800">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-teal-700" />
              Processando trecho de áudio…
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
