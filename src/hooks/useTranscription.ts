"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptionModelId } from "@/config/ai";
import { reconcileTranscript } from "@/lib/clinical/transcript-reconciler";
import { apiErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

interface UseTranscriptionOptions {
  getModel: () => TranscriptionModelId;
}

export function useTranscription({ getModel }: UseTranscriptionOptions) {
  const [confirmedTranscript, setConfirmedTranscript] = useState("");
  const [latestTranscriptSegment, setLatestTranscriptSegment] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmedRef = useRef("");
  const queueRef = useRef<Blob[]>([]);
  const processingRef = useRef(false);
  const getModelRef = useRef(getModel);

  useEffect(() => {
    getModelRef.current = getModel;
  });

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsTranscribing(true);

    while (queueRef.current.length > 0) {
      const blob = queueRef.current.shift();
      if (!blob) continue;

      try {
        const form = new FormData();
        form.append("audio", blob, "chunk.wav");
        form.append("model", getModelRef.current());
        form.append("promptTail", confirmedRef.current);

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 35_000);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ??
              apiErrorMessage(response.status, "Falha na transcrição."),
          );
        }

        const data = (await response.json()) as { text?: string };
        const text = (data.text ?? "").trim();
        if (!text) {
          logger.transcription("empty chunk");
          continue;
        }

        const next = reconcileTranscript(confirmedRef.current, text);
        confirmedRef.current = next;
        setConfirmedTranscript(next);
        setLatestTranscriptSegment(text);
        setError(null);
        logger.transcription("chunk merged", { chars: text.length });
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "AbortError"
            ? "Tempo esgotado na transcrição. A gravação continua."
            : err instanceof Error
              ? err.message
              : "Falha na transcrição. A gravação continua.";
        logger.error("transcription chunk failed", err);
        setError(message);
      }
    }

    processingRef.current = false;
    setIsTranscribing(false);
  }, []);

  const enqueue = useCallback(
    (blob: Blob) => {
      queueRef.current.push(blob);
      void processQueue();
    },
    [processQueue],
  );

  const waitForIdle = useCallback(async () => {
    const started = Date.now();
    while (processingRef.current || queueRef.current.length > 0) {
      if (Date.now() - started > 40_000) break;
      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
  }, []);

  const reset = useCallback(() => {
    queueRef.current = [];
    confirmedRef.current = "";
    processingRef.current = false;
    setConfirmedTranscript("");
    setLatestTranscriptSegment("");
    setIsTranscribing(false);
    setError(null);
  }, []);

  const getConfirmed = useCallback(() => confirmedRef.current, []);

  return {
    confirmedTranscript,
    latestTranscriptSegment,
    isTranscribing,
    error,
    enqueue,
    waitForIdle,
    getConfirmed,
    reset,
  };
}
