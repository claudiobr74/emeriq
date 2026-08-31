"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AI_CONFIG, type TranscriptionModelId } from "@/config/ai";
import { downsample, encodeWav } from "@/lib/audio/wav";
import { PcmRingBuffer } from "@/lib/audio/pcm-ring-buffer";
import { apiErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  maxReconnectAttempts,
  reconnectDelayMs,
  shouldDegrade,
} from "@/lib/transcription/reconnect-policy";
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

type Mode = "idle" | "realtime" | "reconnecting" | "degraded";

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
  const reconnectTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const ringRef = useRef(
    new PcmRingBuffer(AI_CONFIG.realtime.sampleRate * AI_CONFIG.realtime.ringBufferSeconds),
  );

  const queueRef = useRef<Blob[]>([]);
  const processingRef = useRef(false);
  const restSeqRef = useRef(0);
  const getModelRef = useRef(getModel);
  useEffect(() => {
    getModelRef.current = getModel;
  });

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

  const enqueue = useCallback(
    (blob: Blob) => {
      if (modeRef.current !== "degraded") return;
      queueRef.current.push(blob);
      void processQueue();
    },
    [processQueue],
  );

  const flushRingToRest = useCallback(() => {
    const drained = ringRef.current.drain();
    if (drained.samples.length === 0 || drained.sampleRate <= 0) return;
    const downsampled = downsample(
      drained.samples,
      drained.sampleRate,
      AI_CONFIG.sampleRate,
    );
    enqueue(encodeWav(downsampled, AI_CONFIG.sampleRate));
  }, [enqueue]);

  const flushRingToEngine = useCallback((engine: RealtimeTranscriber) => {
    const drained = ringRef.current.drain();
    if (drained.samples.length === 0 || drained.sampleRate <= 0) return;
    engine.pushPcm(drained.samples, drained.sampleRate);
  }, []);

  const connectRef = useRef<() => Promise<boolean>>(() => Promise.resolve(false));
  const scheduleReconnectRef = useRef<() => void>(() => undefined);

  const degrade = useCallback(
    (reason: string) => {
      if (modeRef.current === "degraded") return;
      logger.transcription("degrading to REST", reason);
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      engineRef.current?.close();
      engineRef.current = null;
      modeRef.current = "degraded";
      dispatch({ type: "status", status: "degraded" });
      flushRingToRest();
    },
    [flushRingToRest],
  );

  const scheduleReconnect = useCallback(() => {
    if (pausedRef.current || modeRef.current === "degraded" || modeRef.current === "idle") {
      return;
    }
    if (shouldDegrade(reconnectAttemptsRef.current)) {
      dispatch({ type: "status", status: "failed" });
      degrade("reconnect exhausted");
      return;
    }
    const attempt = reconnectAttemptsRef.current;
    const delay = reconnectDelayMs(attempt);
    reconnectAttemptsRef.current = attempt + 1;
    modeRef.current = "reconnecting";
    dispatch({ type: "status", status: "reconnecting" });
    logger.transcription("reconnect scheduled", {
      attempt: attempt + 1,
      max: maxReconnectAttempts(),
      delay,
    });
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
    }
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      void connectRef.current().then((ok) => {
        if (!ok) scheduleReconnectRef.current();
      });
    }, delay);
  }, [degrade]);

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  const connectRealtime = useCallback(async (): Promise<boolean> => {
    engineRef.current?.close();
    engineRef.current = null;
    const engine = new RealtimeTranscriber({
      onStatus: (status: TranscriptionStatus) =>
        dispatch({ type: "status", status }),
      onAudioAccepted: (id) => dispatch({ type: "audioAccepted", id }),
      onDelta: (id, text) => dispatch({ type: "delta", id, text }),
      onCompleted: (id, text) => dispatch({ type: "completed", id, text }),
      onFailed: (id) => dispatch({ type: "failed", id }),
      onFatal: () => {
        if (pausedRef.current) return;
        if (modeRef.current !== "realtime") return;
        scheduleReconnectRef.current();
      },
    });
    try {
      await engine.connect(getModelRef.current());
      engineRef.current = engine;
      modeRef.current = "realtime";
      reconnectAttemptsRef.current = 0;
      flushRingToEngine(engine);
      return true;
    } catch (err) {
      logger.transcription("realtime connect failed", err);
      engine.close();
      return false;
    }
  }, [flushRingToEngine]);

  useEffect(() => {
    connectRef.current = connectRealtime;
  }, [connectRealtime]);

  const start = useCallback(async () => {
    dispatch({ type: "reset" });
    setError(null);
    pausedRef.current = false;
    reconnectAttemptsRef.current = 0;
    queueRef.current = [];
    ringRef.current.clear();
    const ok = await connectRealtime();
    if (!ok) {
      degrade("initial connect failed");
    }
  }, [connectRealtime, degrade]);

  const pushPcm = useCallback((frame: Float32Array, sourceRate: number) => {
    if (pausedRef.current) return;
    if (modeRef.current === "realtime") {
      engineRef.current?.pushPcm(frame, sourceRate);
      return;
    }
    if (modeRef.current === "reconnecting" || modeRef.current === "idle") {
      ringRef.current.push(frame, sourceRate);
    }
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    engineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    engineRef.current?.resume();
  }, []);

  const flushAndSettle = useCallback(async (): Promise<{
    timedOut: boolean;
    pendingCount: number;
  }> => {
    if (modeRef.current === "reconnecting") {
      flushRingToRest();
    }
    if (modeRef.current === "realtime") engineRef.current?.commit();
    const started = Date.now();
    const maxWaitMs = 40_000;
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
    const pendingCount = pendingSegments(stateRef.current).length;
    const timedOut =
      pendingCount > 0 || queueRef.current.length > 0 || processingRef.current;
    return { timedOut, pendingCount };
  }, [flushRingToRest]);

  const reset = useCallback(() => {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    engineRef.current?.close();
    engineRef.current = null;
    modeRef.current = "idle";
    pausedRef.current = false;
    queueRef.current = [];
    processingRef.current = false;
    restSeqRef.current = 0;
    reconnectAttemptsRef.current = 0;
    ringRef.current.clear();
    dispatch({ type: "reset" });
    setError(null);
  }, []);

  const getConfirmed = useCallback(() => stateRef.current.confirmed, []);

  const hydrateConfirmed = useCallback((confirmed: string) => {
    dispatch({ type: "hydrate", confirmed });
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
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
    hydrateConfirmed,
    reset,
  };
}
