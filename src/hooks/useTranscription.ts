"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AI_CONFIG, type TranscriptionModelId } from "@/config/ai";
import { apiErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  allSegmentsSettled,
  hasFailedSegments,
  initialTranscriptionState,
  pendingSegments,
  transcriptionReducer,
  type TranscriptionStatus,
} from "@/lib/transcription/reducer";
import { RealtimeTranscriber } from "@/lib/transcription/realtime-engine";

interface UseTranscriptionOptions {
  getModel: () => TranscriptionModelId;
}

type Mode = "idle" | "realtime" | "degraded";

export function useTranscription({ getModel }: UseTranscriptionOptions) {
  const [state, dispatch] = useReducer(
    transcriptionReducer,
    undefined,
    initialTranscriptionState,
  );
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const engineRef = useRef<RealtimeTranscriber | null>(null);
  const modeRef = useRef<Mode>("idle");
  const reconnectAttemptsRef = useRef(0);
  const pausedRef = useRef(false);

  // Fila REST (modo degradado)
  const queueRef = useRef<Blob[]>([]);
  const processingRef = useRef(false);
  const restSeqRef = useRef(0);
  const getModelRef = useRef(getModel);
  useEffect(() => {
    getModelRef.current = getModel;
  });

  const degrade = useCallback((reason: string) => {
    if (modeRef.current === "degraded") return;
    logger.transcription("degrading to REST", reason);
    engineRef.current?.close();
    engineRef.current = null;
    modeRef.current = "degraded";
    dispatch({ type: "status", status: "degraded" });
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    while (queueRef.current.length > 0) {
      const blob = queueRef.current.shift();
      if (!blob) continue;
      const id = `rest-${(restSeqRef.current += 1)}`;
      dispatch({ type: "audioAccepted", id });
      try {
        const form = new FormData();
        form.append("audio", blob, "chunk.wav");
        form.append("model", getModelRef.current());
        form.append("promptTail", stateRef.current.confirmed.slice(-180));

        const controller = new AbortController();
        const timeout = window.setTimeout(
          () => controller.abort(),
          AI_CONFIG.timeouts.transcriptionMs,
        );
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
        if (text) {
          dispatch({ type: "completed", id, text });
        } else {
          dispatch({ type: "failed", id });
        }
        setError(null);
      } catch (err) {
        dispatch({ type: "failed", id });
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
  }, []);

  const connectRef = useRef<() => Promise<boolean>>(() => Promise.resolve(false));

  const connectRealtime = useCallback(async (): Promise<boolean> => {
    const engine = new RealtimeTranscriber({
      onStatus: (status: TranscriptionStatus) =>
        dispatch({ type: "status", status }),
      onAudioAccepted: (id) => dispatch({ type: "audioAccepted", id }),
      onDelta: (id, text) => dispatch({ type: "delta", id, text }),
      onCompleted: (id, text) => dispatch({ type: "completed", id, text }),
      onFailed: (id) => dispatch({ type: "failed", id }),
      onFatal: (message) => {
        if (pausedRef.current || modeRef.current !== "realtime") return;
        const attempts = (reconnectAttemptsRef.current += 1);
        if (attempts > AI_CONFIG.realtime.reconnect.maxAttempts) {
          setError(message);
          degrade("reconnect exhausted");
          return;
        }
        dispatch({ type: "status", status: "reconnecting" });
        const delay = Math.min(
          AI_CONFIG.realtime.reconnect.baseDelayMs * 2 ** (attempts - 1),
          AI_CONFIG.realtime.reconnect.maxDelayMs,
        );
        window.setTimeout(() => {
          void connectRef.current();
        }, delay);
      },
    });
    try {
      await engine.connect();
      engineRef.current = engine;
      modeRef.current = "realtime";
      reconnectAttemptsRef.current = 0;
      return true;
    } catch (err) {
      logger.transcription("realtime connect failed", err);
      engine.close();
      return false;
    }
  }, [degrade]);

  useEffect(() => {
    connectRef.current = connectRealtime;
  }, [connectRealtime]);

  const start = useCallback(async () => {
    dispatch({ type: "reset" });
    setError(null);
    pausedRef.current = false;
    reconnectAttemptsRef.current = 0;
    queueRef.current = [];
    const ok = await connectRealtime();
    if (!ok) {
      modeRef.current = "degraded";
      dispatch({ type: "status", status: "degraded" });
    }
  }, [connectRealtime]);

  const pushPcm = useCallback((frame: Float32Array, sourceRate: number) => {
    if (modeRef.current === "realtime") {
      engineRef.current?.pushPcm(frame, sourceRate);
    }
  }, []);

  const enqueue = useCallback(
    (blob: Blob) => {
      if (modeRef.current !== "degraded") return;
      queueRef.current.push(blob);
      void processQueue();
    },
    [processQueue],
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    engineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    engineRef.current?.resume();
  }, []);

  const flushAndSettle = useCallback(async () => {
    if (modeRef.current === "realtime") engineRef.current?.commit();
    const started = Date.now();
    const maxWaitMs = 20_000;
    while (
      !allSegmentsSettled(stateRef.current) ||
      queueRef.current.length > 0 ||
      processingRef.current
    ) {
      if (Date.now() - started > maxWaitMs) {
        logger.transcription("flush timeout with pending segments");
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
  }, []);

  const reset = useCallback(() => {
    engineRef.current?.close();
    engineRef.current = null;
    modeRef.current = "idle";
    pausedRef.current = false;
    queueRef.current = [];
    processingRef.current = false;
    restSeqRef.current = 0;
    reconnectAttemptsRef.current = 0;
    dispatch({ type: "reset" });
    setError(null);
  }, []);

  const getConfirmed = useCallback(() => stateRef.current.confirmed, []);

  useEffect(() => {
    return () => {
      engineRef.current?.close();
    };
  }, []);

  const isTranscribing =
    state.partial.trim() !== "" || pendingSegments(state).length > 0;

  return {
    confirmedTranscript: state.confirmed,
    partialTranscript: state.partial,
    status: state.status,
    isTranscribing,
    isDegraded: state.status === "degraded",
    hasFailedSegments: hasFailedSegments(state),
    error,
    start,
    pushPcm,
    enqueue,
    pause,
    resume,
    flushAndSettle,
    getConfirmed,
    reset,
  };
}
